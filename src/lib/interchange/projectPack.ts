import { assertSafeRelPath } from "../platform/paths";
import { sha256Hex } from "../platform/memoryBridge";
import { EngineeringProject, validateEngineeringProject } from "../kernel/bundle";
import { KERNEL_LIMITS } from "../kernel/limits";
import {
  EngineeringDataset,
  validateDataset
} from "../kernel/datasets";
import {
  EngineeringNotebook,
  validateNotebook
} from "../kernel/notebook";
import {
  assertNoUnsafeKeysDeep,
  assertOnlyKeys,
  assertUniqueIds,
  requireArray,
  requireFiniteNumber,
  requireIdentifier,
  requireInteger,
  requireRecord,
  requireText
} from "../kernel/validation";
import { canonicalJson, canonicalPrettyJson, utf8ByteLength } from "./canonical";

export const PROJECT_PACK_SCHEMA_VERSION = 1 as const;
export const PROJECT_PACK_MAX_CHARACTERS = 2_000_000;

const EXECUTABLE_EXTENSION = /\.(?:app|bat|cmd|com|cpl|dll|dylib|exe|hta|jar|js|jsx|lnk|msi|msp|ps1|py|scr|sh|so|ts|tsx|vbs|wsf)$/i;
const ALLOWED_MEDIA_TYPES = new Set(["application/json", "text/markdown", "text/plain"]);
const ALLOWED_EXTENSIONS = new Set([".json", ".md", ".txt"]);

export interface ProjectPackCompatibility {
  kernelSchemaMinimum: number;
  kernelSchemaMaximum: number;
  applicationVersionRange: string;
}

export interface LearningSequenceStep {
  id: string;
  title: string;
  objective: string;
  projectStage: "learn" | "build" | "analyse" | "prove";
}

export interface NotebookTemplate {
  id: string;
  title: string;
  notebook: EngineeringNotebook;
}

export interface EvidenceRubricCriterion {
  id: string;
  title: string;
  requirement: string;
  weight: number;
}

export interface EvidenceRubric {
  version: 1;
  criteria: EvidenceRubricCriterion[];
}

export interface ProjectPackReport {
  id: string;
  title: string;
  format: "markdown" | "json";
  body: string;
}

export interface ProjectPackLicence {
  spdxId: string;
  name: string;
  text: string;
}

export interface ProjectPackProvenance {
  source: string;
  author: string;
  createdUtc: string;
  licenceIds: string[];
}

export interface ProjectPackContent {
  learningSequence: LearningSequenceStep[];
  project: EngineeringProject;
  discipline: string;
  datasetFixtures: EngineeringDataset[];
  notebookTemplates: NotebookTemplate[];
  evidenceRubric: EvidenceRubric;
  reports: ProjectPackReport[];
  licence: ProjectPackLicence;
  provenance: ProjectPackProvenance;
}

export interface ProjectPackManifestEntry {
  path: string;
  mediaType: "application/json" | "text/markdown" | "text/plain";
  bytes: number;
  sha256: string;
}

export interface ProjectPackManifest {
  version: 1;
  entries: ProjectPackManifestEntry[];
}

export interface ProjectPackSource {
  packId: string;
  packVersion: string;
  generatedUtc: string;
  compatibility: ProjectPackCompatibility;
  content: ProjectPackContent;
}

export interface ProjectPack extends ProjectPackSource {
  schemaVersion: typeof PROJECT_PACK_SCHEMA_VERSION;
  manifest: ProjectPackManifest;
  integrity: {
    algorithm: "sha256";
    contentSha256: string;
  };
}

/**
 * Build a deterministic, data-only project pack.
 *
 * A pack is a bounded JSON document rather than an executable archive. Every
 * virtual file in the manifest is derived from validated content and hashed.
 */
export function createProjectPack(source: ProjectPackSource): ProjectPack {
  const validated = validateSource(source);
  const manifest = buildManifest(validated.content);
  const payload = {
    schemaVersion: PROJECT_PACK_SCHEMA_VERSION,
    packId: validated.packId,
    packVersion: validated.packVersion,
    generatedUtc: validated.generatedUtc,
    compatibility: validated.compatibility,
    content: validated.content,
    manifest
  };
  const contentSha256 = sha256Hex(canonicalJson(payload));
  const pack: ProjectPack = {
    ...payload,
    integrity: { algorithm: "sha256", contentSha256 }
  };
  if (canonicalPrettyJson(pack).length > PROJECT_PACK_MAX_CHARACTERS) {
    throw new Error(`Project pack exceeds ${PROJECT_PACK_MAX_CHARACTERS} characters`);
  }
  return pack;
}

export function exportProjectPack(pack: ProjectPack): string {
  return canonicalPrettyJson(validateProjectPack(pack));
}

export function importProjectPack(serialised: string): ProjectPack {
  if (serialised.length > PROJECT_PACK_MAX_CHARACTERS) {
    throw new Error(`Project pack exceeds ${PROJECT_PACK_MAX_CHARACTERS} characters`);
  }
  let value: unknown;
  try {
    value = JSON.parse(serialised) as unknown;
  } catch {
    throw new Error("Project pack is not valid JSON");
  }
  assertNoUnsafeKeysDeep(value, "project pack");
  return validateProjectPack(value);
}

export function validateProjectPack(value: unknown): ProjectPack {
  const record = requireRecord(value, "project pack");
  assertOnlyKeys(record, new Set([
    "schemaVersion",
    "packId",
    "packVersion",
    "generatedUtc",
    "compatibility",
    "content",
    "manifest",
    "integrity"
  ]), "project pack");
  if (record.schemaVersion !== PROJECT_PACK_SCHEMA_VERSION) {
    throw new Error(`Unsupported project pack schema version ${String(record.schemaVersion)}`);
  }
  validateManifestPathsBeforeContent(record.manifest);
  const source = validateSource({
    packId: record.packId,
    packVersion: record.packVersion,
    generatedUtc: record.generatedUtc,
    compatibility: record.compatibility,
    content: record.content
  });
  const expected = createProjectPack(source);
  const suppliedManifest = validateManifest(record.manifest);
  if (canonicalJson(suppliedManifest) !== canonicalJson(expected.manifest)) {
    throw new Error("Project pack manifest does not match its content");
  }
  const integrity = validateIntegrity(record.integrity);
  if (integrity.contentSha256 !== expected.integrity.contentSha256) {
    throw new Error("Project pack integrity hash does not match its content");
  }
  return expected;
}

/**
 * Resolve a local catalogue of packs by stable pack id.
 *
 * Duplicate ids always require an explicit selected integrity hash. This is a
 * pure resolution rule and performs no file or network access.
 */
export function resolveProjectPackCatalogue(
  packs: ReadonlyArray<ProjectPack>,
  resolutions: Readonly<Record<string, string>> = {}
): ProjectPack[] {
  const groups = new Map<string, ProjectPack[]>();
  for (const candidate of packs) {
    const pack = validateProjectPack(candidate);
    const group = groups.get(pack.packId) ?? [];
    group.push(pack);
    groups.set(pack.packId, group);
  }
  const output: ProjectPack[] = [];
  for (const [packId, group] of groups) {
    if (group.length === 1) {
      output.push(group[0]);
      continue;
    }
    const selectedHash = resolutions[packId];
    if (!selectedHash) {
      throw new Error(`Project pack catalogue contains duplicate stable id ${packId}`);
    }
    const matches = group.filter((pack) => pack.integrity.contentSha256 === selectedHash);
    if (matches.length !== 1) {
      throw new Error(`Resolution for project pack ${packId} does not select exactly one pack`);
    }
    output.push(matches[0]);
  }
  return output.sort((left, right) => compareText(left.packId, right.packId));
}

function validateSource(value: unknown): ProjectPackSource {
  const record = requireRecord(value, "project pack source");
  assertOnlyKeys(record, new Set([
    "packId", "packVersion", "generatedUtc", "compatibility", "content"
  ]), "project pack source");
  const content = validateContent(record.content);
  const compatibility = validateCompatibility(record.compatibility);
  if (
    content.project.version < compatibility.kernelSchemaMinimum ||
    content.project.version > compatibility.kernelSchemaMaximum
  ) {
    throw new Error("Project pack compatibility range does not include its kernel project schema");
  }
  const source: ProjectPackSource = {
    packId: requireIdentifier(record.packId, "project pack source.packId"),
    packVersion: validateVersion(record.packVersion, "project pack source.packVersion"),
    generatedUtc: validateUtc(record.generatedUtc, "project pack source.generatedUtc"),
    compatibility,
    content
  };
  assertNoExecutableContent(source, "project pack");
  if (canonicalJson(source).length > PROJECT_PACK_MAX_CHARACTERS) {
    throw new Error(`Project pack exceeds ${PROJECT_PACK_MAX_CHARACTERS} characters`);
  }
  return source;
}

function validateCompatibility(value: unknown): ProjectPackCompatibility {
  const record = requireRecord(value, "project pack compatibility");
  assertOnlyKeys(record, new Set([
    "kernelSchemaMinimum", "kernelSchemaMaximum", "applicationVersionRange"
  ]), "project pack compatibility");
  const kernelSchemaMinimum = requireInteger(
    record.kernelSchemaMinimum,
    "project pack compatibility.kernelSchemaMinimum",
    1,
    1_000
  );
  const kernelSchemaMaximum = requireInteger(
    record.kernelSchemaMaximum,
    "project pack compatibility.kernelSchemaMaximum",
    1,
    1_000
  );
  if (kernelSchemaMinimum > kernelSchemaMaximum) {
    throw new Error("Project pack compatibility schema range is inverted");
  }
  return {
    kernelSchemaMinimum,
    kernelSchemaMaximum,
    applicationVersionRange: requireText(
      record.applicationVersionRange,
      "project pack compatibility.applicationVersionRange",
      120
    )
  };
}

function validateContent(value: unknown): ProjectPackContent {
  const record = requireRecord(value, "project pack content");
  assertOnlyKeys(record, new Set([
    "learningSequence",
    "project",
    "discipline",
    "datasetFixtures",
    "notebookTemplates",
    "evidenceRubric",
    "reports",
    "licence",
    "provenance"
  ]), "project pack content");
  const datasetFixtures = requireArray(
    record.datasetFixtures,
    "project pack content.datasetFixtures",
    64
  ).map((dataset, index) => validateDataset(dataset, undefined, `datasetFixtures[${index}]`));
  if (datasetFixtures.length === 0) {
    throw new Error("Project pack content.datasetFixtures must not be empty");
  }
  assertUniqueIds(datasetFixtures, "project pack content.datasetFixtures");
  const notebookTemplates = validateNotebookTemplates(record.notebookTemplates);
  const reports = validateReports(record.reports);
  const project = validateEngineeringProject(record.project);
  if (project.variables.length === 0 || project.calculations.length === 0) {
    throw new Error("Project pack kernel project must contain variables and calculations");
  }
  const licence = validateLicence(record.licence);
  const provenance = validateProvenance(record.provenance);
  if (!provenance.licenceIds.includes(licence.spdxId)) {
    throw new Error("Project pack provenance must reference its declared licence");
  }
  return {
    learningSequence: validateLearningSequence(record.learningSequence),
    project,
    discipline: requireText(
      record.discipline,
      "project pack content.discipline",
      KERNEL_LIMITS.shortTextCharacters
    ),
    datasetFixtures: [...datasetFixtures].sort(compareId),
    notebookTemplates: [...notebookTemplates].sort(compareId),
    evidenceRubric: validateRubric(record.evidenceRubric),
    reports: [...reports].sort(compareId),
    licence,
    provenance
  };
}

function validateLearningSequence(value: unknown): LearningSequenceStep[] {
  const steps = requireArray(value, "learning sequence", 128).map((step, index) => {
    const path = `learning sequence[${index}]`;
    const record = requireRecord(step, path);
    assertOnlyKeys(record, new Set(["id", "title", "objective", "projectStage"]), path);
    if (
      record.projectStage !== "learn" &&
      record.projectStage !== "build" &&
      record.projectStage !== "analyse" &&
      record.projectStage !== "prove"
    ) {
      throw new Error(`${path}.projectStage is invalid`);
    }
    return {
      id: requireIdentifier(record.id, `${path}.id`),
      title: requireText(record.title, `${path}.title`, KERNEL_LIMITS.shortTextCharacters),
      objective: requireText(record.objective, `${path}.objective`, KERNEL_LIMITS.longTextCharacters),
      projectStage: record.projectStage as LearningSequenceStep["projectStage"]
    };
  });
  if (steps.length === 0) throw new Error("Learning sequence must contain at least one step");
  assertUniqueIds(steps, "learning sequence");
  return steps;
}

function validateNotebookTemplates(value: unknown): NotebookTemplate[] {
  const templates = requireArray(value, "notebook templates", 64).map((template, index) => {
    const path = `notebook templates[${index}]`;
    const record = requireRecord(template, path);
    assertOnlyKeys(record, new Set(["id", "title", "notebook"]), path);
    return {
      id: requireIdentifier(record.id, `${path}.id`),
      title: requireText(record.title, `${path}.title`, KERNEL_LIMITS.shortTextCharacters),
      notebook: validateNotebook(record.notebook, `${path}.notebook`)
    };
  });
  if (templates.length === 0) throw new Error("Notebook templates must not be empty");
  assertUniqueIds(templates, "notebook templates");
  return templates;
}

function validateRubric(value: unknown): EvidenceRubric {
  const record = requireRecord(value, "evidence rubric");
  assertOnlyKeys(record, new Set(["version", "criteria"]), "evidence rubric");
  if (record.version !== 1) throw new Error("Evidence rubric version is unsupported");
  const criteria = requireArray(record.criteria, "evidence rubric.criteria", 128)
    .map((criterion, index) => {
      const path = `evidence rubric.criteria[${index}]`;
      const item = requireRecord(criterion, path);
      assertOnlyKeys(item, new Set(["id", "title", "requirement", "weight"]), path);
      const weight = requireFiniteNumber(item.weight, `${path}.weight`);
      if (weight <= 0 || weight > 1) throw new Error(`${path}.weight must be greater than zero and at most one`);
      return {
        id: requireIdentifier(item.id, `${path}.id`),
        title: requireText(item.title, `${path}.title`, KERNEL_LIMITS.shortTextCharacters),
        requirement: requireText(item.requirement, `${path}.requirement`, KERNEL_LIMITS.longTextCharacters),
        weight
      };
    });
  if (criteria.length === 0) throw new Error("Evidence rubric must contain at least one criterion");
  assertUniqueIds(criteria, "evidence rubric.criteria");
  const weightTotal = criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (Math.abs(weightTotal - 1) > 1e-12) {
    throw new Error("Evidence rubric weights must total one");
  }
  return { version: 1, criteria: [...criteria].sort(compareId) };
}

function validateReports(value: unknown): ProjectPackReport[] {
  const reports = requireArray(value, "project pack reports", 64).map((report, index) => {
    const path = `project pack reports[${index}]`;
    const record = requireRecord(report, path);
    assertOnlyKeys(record, new Set(["id", "title", "format", "body"]), path);
    if (record.format !== "markdown" && record.format !== "json") {
      throw new Error(`${path}.format is invalid`);
    }
    const body = requireText(record.body, `${path}.body`, 500_000);
    if (record.format === "json") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body) as unknown;
      } catch {
        throw new Error(`${path}.body is not valid JSON`);
      }
      assertNoUnsafeKeysDeep(parsed, `${path}.body`);
    }
    return {
      id: requireIdentifier(record.id, `${path}.id`),
      title: requireText(record.title, `${path}.title`, KERNEL_LIMITS.shortTextCharacters),
      format: record.format as ProjectPackReport["format"],
      body
    };
  });
  if (reports.length === 0) throw new Error("Project pack reports must not be empty");
  assertUniqueIds(reports, "project pack reports");
  return reports;
}

function validateLicence(value: unknown): ProjectPackLicence {
  const record = requireRecord(value, "project pack licence");
  assertOnlyKeys(record, new Set(["spdxId", "name", "text"]), "project pack licence");
  return {
    spdxId: requireIdentifier(record.spdxId, "project pack licence.spdxId"),
    name: requireText(record.name, "project pack licence.name", KERNEL_LIMITS.shortTextCharacters),
    text: requireText(record.text, "project pack licence.text", 100_000)
  };
}

function validateProvenance(value: unknown): ProjectPackProvenance {
  const record = requireRecord(value, "project pack provenance");
  assertOnlyKeys(record, new Set([
    "source", "author", "createdUtc", "licenceIds"
  ]), "project pack provenance");
  const licenceIds = requireArray(record.licenceIds, "project pack provenance.licenceIds", 64)
    .map((id, index) => requireIdentifier(id, `project pack provenance.licenceIds[${index}]`));
  if (new Set(licenceIds).size !== licenceIds.length) {
    throw new Error("Project pack provenance contains duplicate licence ids");
  }
  return {
    source: requireText(record.source, "project pack provenance.source", KERNEL_LIMITS.longTextCharacters),
    author: requireText(record.author, "project pack provenance.author", KERNEL_LIMITS.shortTextCharacters),
    createdUtc: validateUtc(record.createdUtc, "project pack provenance.createdUtc"),
    licenceIds: [...licenceIds].sort(compareText)
  };
}

function buildManifest(content: ProjectPackContent): ProjectPackManifest {
  const virtualFiles: Array<{
    path: string;
    mediaType: ProjectPackManifestEntry["mediaType"];
    body: string;
  }> = [
    { path: "learning/sequence.json", mediaType: "application/json", body: canonicalPrettyJson(content.learningSequence) },
    {
      path: "project/project.json",
      mediaType: "application/json",
      body: canonicalPrettyJson({ discipline: content.discipline, project: content.project })
    },
    { path: "kernel/variables.json", mediaType: "application/json", body: canonicalPrettyJson(content.project.variables) },
    { path: "kernel/calculations.json", mediaType: "application/json", body: canonicalPrettyJson(content.project.calculations) },
    { path: "kernel/scenarios.json", mediaType: "application/json", body: canonicalPrettyJson(content.project.scenarioSet) },
    { path: "kernel/evidence-graph.json", mediaType: "application/json", body: canonicalPrettyJson(content.project.evidenceGraph) },
    { path: "evidence/rubric.json", mediaType: "application/json", body: canonicalPrettyJson(content.evidenceRubric) },
    { path: "licence/LICENCE.txt", mediaType: "text/plain", body: normaliseText(content.licence.text) },
    { path: "licence/metadata.json", mediaType: "application/json", body: canonicalPrettyJson({
      name: content.licence.name,
      spdxId: content.licence.spdxId
    }) },
    { path: "provenance/provenance.json", mediaType: "application/json", body: canonicalPrettyJson(content.provenance) }
  ];
  for (const dataset of content.datasetFixtures) {
    virtualFiles.push({
      path: `datasets/${dataset.id}.json`,
      mediaType: "application/json",
      body: canonicalPrettyJson(dataset)
    });
  }
  for (const template of content.notebookTemplates) {
    virtualFiles.push({
      path: `notebooks/${template.id}.json`,
      mediaType: "application/json",
      body: canonicalPrettyJson(template)
    });
  }
  for (const report of content.reports) {
    const extension = report.format === "markdown" ? "md" : "json";
    virtualFiles.push({
      path: `reports/${report.id}.${extension}`,
      mediaType: report.format === "markdown" ? "text/markdown" : "application/json",
      body: report.format === "markdown" ? normaliseText(report.body) : canonicalPrettyJson(JSON.parse(report.body))
    });
  }
  const entries = virtualFiles.map((file) => {
    validatePackPath(file.path, file.mediaType);
    return {
      path: file.path,
      mediaType: file.mediaType,
      bytes: utf8ByteLength(file.body),
      sha256: sha256Hex(file.body)
    };
  }).sort((left, right) => compareText(left.path, right.path));
  const paths = new Set<string>();
  for (const entry of entries) {
    if (paths.has(entry.path)) throw new Error(`Project pack manifest contains duplicate path ${entry.path}`);
    paths.add(entry.path);
  }
  return { version: 1, entries };
}

function validateManifestPathsBeforeContent(value: unknown): void {
  const record = requireRecord(value, "project pack manifest");
  const entries = requireArray(record.entries, "project pack manifest.entries", 1_024);
  entries.forEach((entry, index) => {
    const item = requireRecord(entry, `project pack manifest.entries[${index}]`);
    const path = requireText(item.path, `project pack manifest.entries[${index}].path`, 4_096);
    const mediaType = requireText(item.mediaType, `project pack manifest.entries[${index}].mediaType`, 120);
    validatePackPath(path, mediaType);
  });
}

function validateManifest(value: unknown): ProjectPackManifest {
  const record = requireRecord(value, "project pack manifest");
  assertOnlyKeys(record, new Set(["version", "entries"]), "project pack manifest");
  if (record.version !== 1) throw new Error("Project pack manifest version is unsupported");
  const entries = requireArray(record.entries, "project pack manifest.entries", 1_024)
    .map((entry, index) => {
      const path = `project pack manifest.entries[${index}]`;
      const item = requireRecord(entry, path);
      assertOnlyKeys(item, new Set(["path", "mediaType", "bytes", "sha256"]), path);
      const relPath = requireText(item.path, `${path}.path`, 4_096);
      const mediaType = requireText(item.mediaType, `${path}.mediaType`, 120);
      validatePackPath(relPath, mediaType);
      const sha256 = requireText(item.sha256, `${path}.sha256`, 64);
      if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error(`${path}.sha256 is invalid`);
      return {
        path: relPath,
        mediaType: mediaType as ProjectPackManifestEntry["mediaType"],
        bytes: requireInteger(item.bytes, `${path}.bytes`, 0, PROJECT_PACK_MAX_CHARACTERS * 4),
        sha256
      };
    });
  const paths = new Set<string>();
  for (const entry of entries) {
    if (paths.has(entry.path)) throw new Error(`Project pack manifest contains duplicate path ${entry.path}`);
    paths.add(entry.path);
  }
  return { version: 1, entries };
}

function validatePackPath(path: string, mediaType: string): void {
  assertSafeRelPath(path);
  if (EXECUTABLE_EXTENSION.test(path)) throw new Error(`Executable project pack path rejected: ${path}`);
  const dot = path.lastIndexOf(".");
  const extension = dot >= 0 ? path.slice(dot).toLowerCase() : "";
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    throw new Error(`Unexpected project pack content type rejected: ${path}`);
  }
  if (
    (extension === ".json" && mediaType !== "application/json") ||
    (extension === ".md" && mediaType !== "text/markdown") ||
    (extension === ".txt" && mediaType !== "text/plain")
  ) {
    throw new Error(`Project pack path and media type do not match: ${path}`);
  }
}

function validateIntegrity(value: unknown): ProjectPack["integrity"] {
  const record = requireRecord(value, "project pack integrity");
  assertOnlyKeys(record, new Set(["algorithm", "contentSha256"]), "project pack integrity");
  if (record.algorithm !== "sha256") throw new Error("Project pack integrity algorithm is unsupported");
  const contentSha256 = requireText(record.contentSha256, "project pack integrity.contentSha256", 64);
  if (!/^[a-f0-9]{64}$/.test(contentSha256)) {
    throw new Error("Project pack integrity hash is invalid");
  }
  return { algorithm: "sha256", contentSha256 };
}

function validateUtc(value: unknown, path: string): string {
  const timestamp = requireText(value, path, 40);
  const parsed = new Date(timestamp);
  if (!timestamp.endsWith("Z") || Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== timestamp) {
    throw new Error(`${path} must be an exact ISO-8601 UTC timestamp`);
  }
  return timestamp;
}

function validateVersion(value: unknown, path: string): string {
  const version = requireText(value, path, 64);
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`${path} must be a semantic version`);
  }
  return version;
}

function assertNoExecutableContent(value: unknown, path: string): void {
  if (typeof value === "string") {
    if (
      /<\s*\/?\s*[a-z][^>]*>/i.test(value) ||
      /\b(?:javascript|vbscript|data|file)\s*:/i.test(value) ||
      /\bon[a-z][a-z0-9_-]*\s*=/i.test(value) ||
      /\b(?:srcdoc|xlink:href)\s*=/i.test(value) ||
      /(?:@import|url\s*\()/i.test(value) ||
      /!\s*\[/i.test(value) ||
      /\[[^\]\r\n]{0,512}\]\(\s*(?:https?:|ftp:|file:|data:|javascript:|vbscript:|\/\/)/i.test(value) ||
      /^#!/m.test(value)
    ) {
      throw new Error(`${path} contains executable content`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoExecutableContent(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === "object" && value !== null) {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) =>
      assertNoExecutableContent(item, `${path}.${key}`)
    );
  }
}

function normaliseText(value: string): string {
  return `${value.replace(/\r\n?/g, "\n").replace(/\s+$/g, "")}\n`;
}

function compareId<T extends { id: string }>(left: T, right: T): number {
  return compareText(left.id, right.id);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
