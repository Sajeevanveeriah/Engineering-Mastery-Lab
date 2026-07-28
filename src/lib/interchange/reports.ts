import { sha256Hex } from "../platform/memoryBridge";
import {
  ENGINEERING_UNIT_REGISTRY,
  getEngineeringDimensionLabel,
  getEngineeringUnit,
  getEngineeringUnitSymbol,
  toBaseEngineeringValue,
  type EngineeringDimension
} from "../kernel/units";
import { resolveScenarioVariables } from "../kernel/scenarios";
import {
  assertOnlyKeys,
  requireArray,
  requireFiniteNumber,
  requireIdentifier,
  requireRecord,
  requireText
} from "../kernel/validation";
import { canonicalJson, canonicalPrettyJson } from "./canonical";
import { ProjectPack, validateProjectPack } from "./projectPack";

export interface EngineeringReportResult {
  id: string;
  label: string;
  value: number;
  unitId: string;
  status: "pass" | "warning" | "fail" | "informational";
}

export interface AccessibleChartTable {
  id: string;
  title: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

export interface EngineeringReportOptions {
  generatedUtc: string;
  scenarioId: string;
  numericTolerance: number;
  tolerances: string[];
  results: EngineeringReportResult[];
  charts: AccessibleChartTable[];
  validation: string[];
  warnings: string[];
  limits: string[];
  lineage: string[];
  environment: Record<string, string>;
}

export interface EngineeringReportInput {
  schemaVersion: 1;
  generatedUtc: string;
  numericTolerance: number;
  project: {
    id: string;
    name: string;
    discipline: string;
    packVersion: string;
  };
  scenario: {
    id: string;
    name: string;
    kind: "baseline" | "named";
  };
  inputs: Array<{
    id: string;
    label: string;
    role: "input" | "assumption" | "derived";
    dimension: EngineeringDimension;
    siValue: number;
    siUnitId: string;
    displayValue: number;
    displayUnitId: string;
  }>;
  assumptions: string[];
  tolerances: string[];
  models: Array<{
    id: string;
    label: string;
    equation: string;
    algorithmId: string;
    modelVersion: string;
  }>;
  datasets: Array<{
    id: string;
    name: string;
    source: "manual" | "csv" | "json";
    provenance: string;
    contentSha256: string;
  }>;
  results: EngineeringReportResult[];
  charts: AccessibleChartTable[];
  validation: string[];
  warnings: string[];
  limits: string[];
  lineage: string[];
  environment: Record<string, string>;
  integrity: {
    algorithm: "sha256";
    projectPackSha256: string;
    reportSourceSha256: string;
  };
}

export interface EngineeringReportArtefacts {
  markdown: string;
  json: string;
  integrity: {
    algorithm: "sha256";
    markdownSha256: string;
    jsonSha256: string;
  };
}

export function createEngineeringReportInput(
  candidatePack: ProjectPack,
  candidateOptions: EngineeringReportOptions
): EngineeringReportInput {
  const pack = validateProjectPack(candidatePack);
  const options = validateReportOptions(candidateOptions);
  const scenario = pack.content.project.scenarioSet.scenarios.find((item) => item.id === options.scenarioId);
  if (!scenario) throw new Error(`Report scenario ${options.scenarioId} is not present in the project pack`);
  const resolved = resolveScenarioVariables(pack.content.project.variables, scenario);
  const assumptions = new Set<string>();
  for (const calculation of pack.content.project.calculations) {
    calculation.assumptions.forEach((assumption) => assumptions.add(assumption));
  }
  const withoutIntegrity = {
    schemaVersion: 1 as const,
    generatedUtc: options.generatedUtc,
    numericTolerance: options.numericTolerance,
    project: {
      id: pack.content.project.id,
      name: pack.content.project.name,
      discipline: pack.content.discipline,
      packVersion: pack.packVersion
    },
    scenario: {
      id: scenario.id,
      name: scenario.name,
      kind: scenario.kind
    },
    inputs: resolved.map((variable) => {
      const displayUnit = getEngineeringUnit(variable.unitId);
      const siUnit = ENGINEERING_UNIT_REGISTRY.units.find((unit) =>
        unit.dimension === displayUnit.dimension &&
        unit.scaleToBase === 1 &&
        unit.offsetToBase === 0
      );
      if (!siUnit) throw new Error(`No SI base unit is registered for ${displayUnit.dimension}`);
      return {
        id: variable.id,
        label: variable.label,
        role: variable.role,
        dimension: variable.dimension,
        siValue: toBaseEngineeringValue(variable.value, variable.unitId),
        siUnitId: siUnit.id,
        displayValue: variable.value,
        displayUnitId: variable.unitId
      };
    }).sort(compareId),
    assumptions: [...assumptions].sort(compareText),
    tolerances: [...options.tolerances].sort(compareText),
    models: pack.content.project.calculations.map((calculation) => ({
      id: calculation.id,
      label: calculation.label,
      equation: calculation.equation,
      algorithmId: calculation.algorithmId,
      modelVersion: calculation.algorithmVersion
    })).sort(compareId),
    datasets: pack.content.datasetFixtures.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      source: dataset.source,
      provenance: [
        dataset.provenance.sourceLabel,
        dataset.provenance.licenceId ? `licence ${dataset.provenance.licenceId}` : "licence not declared",
        dataset.provenance.learnerGenerated ? "learner-generated" : "not learner-generated"
      ].join("; "),
      contentSha256: sha256Hex(canonicalJson(dataset))
    })).sort(compareId),
    results: [...options.results].sort(compareId),
    charts: [...options.charts].sort(compareId),
    validation: [...options.validation].sort(compareText),
    warnings: [...options.warnings].sort(compareText),
    limits: [...options.limits].sort(compareText),
    lineage: [
      ...options.lineage,
      `project-pack:${pack.packId}@${pack.packVersion}`,
      `project-pack-sha256:${pack.integrity.contentSha256}`
    ].sort(compareText),
    environment: sortStringRecord(options.environment)
  };
  return {
    ...withoutIntegrity,
    integrity: {
      algorithm: "sha256",
      projectPackSha256: pack.integrity.contentSha256,
      reportSourceSha256: sha256Hex(canonicalJson(withoutIntegrity))
    }
  };
}

export function generateEngineeringReports(input: EngineeringReportInput): EngineeringReportArtefacts {
  const valid = validateEngineeringReportInput(input);
  const json = canonicalPrettyJson(valid);
  const markdown = generateMarkdown(valid);
  return {
    markdown,
    json,
    integrity: {
      algorithm: "sha256",
      markdownSha256: sha256Hex(markdown),
      jsonSha256: sha256Hex(json)
    }
  };
}

function validateReportOptions(value: unknown): EngineeringReportOptions {
  const record = requireRecord(value, "engineering report options");
  assertOnlyKeys(record, new Set([
    "generatedUtc",
    "scenarioId",
    "numericTolerance",
    "tolerances",
    "results",
    "charts",
    "validation",
    "warnings",
    "limits",
    "lineage",
    "environment"
  ]), "engineering report options");
  const numericTolerance = requireFiniteNumber(record.numericTolerance, "engineering report options.numericTolerance");
  if (numericTolerance <= 0) throw new Error("Engineering report numeric tolerance must be positive");
  return {
    generatedUtc: validateUtc(record.generatedUtc, "engineering report options.generatedUtc"),
    scenarioId: requireIdentifier(record.scenarioId, "engineering report options.scenarioId"),
    numericTolerance,
    tolerances: validateTextArray(record.tolerances, "engineering report options.tolerances", 128),
    results: validateResults(record.results),
    charts: validateCharts(record.charts),
    validation: validateTextArray(record.validation, "engineering report options.validation", 256),
    warnings: validateTextArray(record.warnings, "engineering report options.warnings", 256),
    limits: validateTextArray(record.limits, "engineering report options.limits", 256),
    lineage: validateTextArray(record.lineage, "engineering report options.lineage", 256),
    environment: validateEnvironment(record.environment)
  };
}

function validateEngineeringReportInput(value: unknown): EngineeringReportInput {
  const record = requireRecord(value, "engineering report input");
  assertOnlyKeys(record, new Set([
    "schemaVersion",
    "generatedUtc",
    "numericTolerance",
    "project",
    "scenario",
    "inputs",
    "assumptions",
    "tolerances",
    "models",
    "datasets",
    "results",
    "charts",
    "validation",
    "warnings",
    "limits",
    "lineage",
    "environment",
    "integrity"
  ]), "engineering report input");
  if (record.schemaVersion !== 1) throw new Error("Engineering report schema version is unsupported");
  validateUtc(record.generatedUtc, "engineering report input.generatedUtc");
  const numericTolerance = requireFiniteNumber(
    record.numericTolerance,
    "engineering report input.numericTolerance"
  );
  if (numericTolerance <= 0) throw new Error("Engineering report input.numericTolerance must be positive");
  validateReportProject(record.project);
  validateReportScenario(record.scenario);
  validateReportInputs(record.inputs);
  validateTextArray(record.assumptions, "engineering report input.assumptions", 512);
  validateTextArray(record.tolerances, "engineering report input.tolerances", 512);
  validateReportModels(record.models);
  validateReportDatasets(record.datasets);
  validateResults(record.results);
  validateCharts(record.charts);
  validateTextArray(record.validation, "engineering report input.validation", 512);
  validateTextArray(record.warnings, "engineering report input.warnings", 512);
  validateTextArray(record.limits, "engineering report input.limits", 512);
  validateTextArray(record.lineage, "engineering report input.lineage", 512);
  validateEnvironment(record.environment);
  const integrity = requireRecord(record.integrity, "engineering report input.integrity");
  assertOnlyKeys(integrity, new Set([
    "algorithm", "projectPackSha256", "reportSourceSha256"
  ]), "engineering report input.integrity");
  if (integrity.algorithm !== "sha256") throw new Error("Engineering report integrity algorithm is unsupported");
  for (const key of ["projectPackSha256", "reportSourceSha256"]) {
    const hash = requireText(integrity[key], `engineering report input.integrity.${key}`, 64);
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error(`engineering report input.integrity.${key} is invalid`);
  }
  canonicalJson(record);
  const sourceWithoutIntegrity: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const [key, item] of Object.entries(record)) {
    if (key !== "integrity") sourceWithoutIntegrity[key] = item;
  }
  if (integrity.reportSourceSha256 !== sha256Hex(canonicalJson(sourceWithoutIntegrity))) {
    throw new Error("Engineering report source integrity hash does not match its content");
  }
  return record as unknown as EngineeringReportInput;
}

function validateReportProject(value: unknown): void {
  const record = requireRecord(value, "engineering report input.project");
  assertOnlyKeys(record, new Set([
    "id", "name", "discipline", "packVersion"
  ]), "engineering report input.project");
  requireIdentifier(record.id, "engineering report input.project.id");
  requireText(record.name, "engineering report input.project.name", 240);
  requireText(record.discipline, "engineering report input.project.discipline", 240);
  requireText(record.packVersion, "engineering report input.project.packVersion", 64);
}

function validateReportScenario(value: unknown): void {
  const record = requireRecord(value, "engineering report input.scenario");
  assertOnlyKeys(record, new Set(["id", "name", "kind"]), "engineering report input.scenario");
  requireIdentifier(record.id, "engineering report input.scenario.id");
  requireText(record.name, "engineering report input.scenario.name", 240);
  if (record.kind !== "baseline" && record.kind !== "named") {
    throw new Error("engineering report input.scenario.kind is invalid");
  }
}

function validateReportInputs(value: unknown): void {
  const inputs = requireArray(value, "engineering report input.inputs", 512).map((candidate, index) => {
    const path = `engineering report input.inputs[${index}]`;
    const record = requireRecord(candidate, path);
    assertOnlyKeys(record, new Set([
      "id",
      "label",
      "role",
      "dimension",
      "siValue",
      "siUnitId",
      "displayValue",
      "displayUnitId"
    ]), path);
    if (record.role !== "input" && record.role !== "assumption" && record.role !== "derived") {
      throw new Error(`${path}.role is invalid`);
    }
    const displayUnitId = requireIdentifier(record.displayUnitId, `${path}.displayUnitId`);
    const siUnitId = requireIdentifier(record.siUnitId, `${path}.siUnitId`);
    const displayUnit = getEngineeringUnit(displayUnitId);
    const siUnit = getEngineeringUnit(siUnitId);
    if (record.dimension !== displayUnit.dimension || siUnit.dimension !== displayUnit.dimension) {
      throw new Error(`${path} contains inconsistent dimensions`);
    }
    if (siUnit.scaleToBase !== 1 || siUnit.offsetToBase !== 0) {
      throw new Error(`${path}.siUnitId is not an SI base unit`);
    }
    const displayValue = requireFiniteNumber(record.displayValue, `${path}.displayValue`);
    const siValue = requireFiniteNumber(record.siValue, `${path}.siValue`);
    const expectedSi = toBaseEngineeringValue(displayValue, displayUnitId);
    const scale = Math.max(1, Math.abs(siValue), Math.abs(expectedSi));
    if (Math.abs(siValue - expectedSi) > Number.EPSILON * scale * 16) {
      throw new Error(`${path}.siValue does not match the display value`);
    }
    return {
      id: requireIdentifier(record.id, `${path}.id`)
    };
  });
  ensureUniqueIds(inputs, "engineering report input.inputs");
}

function validateReportModels(value: unknown): void {
  const models = requireArray(value, "engineering report input.models", 512).map((candidate, index) => {
    const path = `engineering report input.models[${index}]`;
    const record = requireRecord(candidate, path);
    assertOnlyKeys(record, new Set([
      "id", "label", "equation", "algorithmId", "modelVersion"
    ]), path);
    return {
      id: requireIdentifier(record.id, `${path}.id`),
      label: requireText(record.label, `${path}.label`, 240),
      equation: requireText(record.equation, `${path}.equation`, 1_000),
      algorithmId: requireIdentifier(record.algorithmId, `${path}.algorithmId`),
      modelVersion: requireText(record.modelVersion, `${path}.modelVersion`, 80)
    };
  });
  ensureUniqueIds(models, "engineering report input.models");
}

function validateReportDatasets(value: unknown): void {
  const datasets = requireArray(value, "engineering report input.datasets", 512).map((candidate, index) => {
    const path = `engineering report input.datasets[${index}]`;
    const record = requireRecord(candidate, path);
    assertOnlyKeys(record, new Set([
      "id", "name", "source", "provenance", "contentSha256"
    ]), path);
    if (record.source !== "manual" && record.source !== "csv" && record.source !== "json") {
      throw new Error(`${path}.source is invalid`);
    }
    const hash = requireText(record.contentSha256, `${path}.contentSha256`, 64);
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error(`${path}.contentSha256 is invalid`);
    return {
      id: requireIdentifier(record.id, `${path}.id`),
      name: requireText(record.name, `${path}.name`, 240),
      provenance: requireText(record.provenance, `${path}.provenance`, 20_000)
    };
  });
  ensureUniqueIds(datasets, "engineering report input.datasets");
}

function validateResults(value: unknown): EngineeringReportResult[] {
  const results = requireArray(value, "engineering report results", 512).map((result, index) => {
    const path = `engineering report results[${index}]`;
    const record = requireRecord(result, path);
    assertOnlyKeys(record, new Set(["id", "label", "value", "unitId", "status"]), path);
    if (
      record.status !== "pass" &&
      record.status !== "warning" &&
      record.status !== "fail" &&
      record.status !== "informational"
    ) {
      throw new Error(`${path}.status is invalid`);
    }
    const unitId = requireIdentifier(record.unitId, `${path}.unitId`);
    getEngineeringUnit(unitId);
    return {
      id: requireIdentifier(record.id, `${path}.id`),
      label: requireText(record.label, `${path}.label`, 240),
      value: requireFiniteNumber(record.value, `${path}.value`),
      unitId,
      status: record.status as EngineeringReportResult["status"]
    };
  });
  ensureUniqueIds(results, "engineering report results");
  return results;
}

function validateCharts(value: unknown): AccessibleChartTable[] {
  const charts = requireArray(value, "engineering report charts", 128).map((chart, chartIndex) => {
    const path = `engineering report charts[${chartIndex}]`;
    const record = requireRecord(chart, path);
    assertOnlyKeys(record, new Set(["id", "title", "columns", "rows"]), path);
    const columns = validateTextArray(record.columns, `${path}.columns`, 64);
    if (columns.length === 0) throw new Error(`${path}.columns must not be empty`);
    const rows = requireArray(record.rows, `${path}.rows`, 5_000).map((row, rowIndex) => {
      const cells = requireArray(row, `${path}.rows[${rowIndex}]`, columns.length);
      if (cells.length !== columns.length) throw new Error(`${path}.rows[${rowIndex}] has the wrong number of cells`);
      return cells.map((cell, cellIndex) => validateChartCell(cell, `${path}.rows[${rowIndex}][${cellIndex}]`));
    });
    return {
      id: requireIdentifier(record.id, `${path}.id`),
      title: requireText(record.title, `${path}.title`, 240),
      columns,
      rows
    };
  });
  ensureUniqueIds(charts, "engineering report charts");
  return charts;
}

function validateChartCell(value: unknown, path: string): string | number | null {
  if (value === null) return null;
  if (typeof value === "number") return requireFiniteNumber(value, path);
  return requireText(value, path, 2_000);
}

function validateTextArray(value: unknown, path: string, maximum: number): string[] {
  return requireArray(value, path, maximum)
    .map((item, index) => requireText(item, `${path}[${index}]`, 20_000));
}

function validateEnvironment(value: unknown): Record<string, string> {
  const record = requireRecord(value, "engineering report environment");
  if (Object.keys(record).length > 128) throw new Error("Engineering report environment exceeds 128 entries");
  const output: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [key, item] of Object.entries(record)) {
    const id = requireIdentifier(key, "engineering report environment key");
    output[id] = requireText(item, `engineering report environment.${id}`, 240);
  }
  return output;
}

function generateMarkdown(input: EngineeringReportInput): string {
  const lines: string[] = [
    `# Engineering Report: ${escapeMarkdown(input.project.name)}`,
    "",
    `Generated UTC: ${escapeMarkdown(input.generatedUtc)}`,
    `Numeric comparison tolerance: ${formatNumber(input.numericTolerance)}`,
    `Project pack: ${escapeMarkdown(input.project.id)} ${escapeMarkdown(input.project.packVersion)}`,
    `Scenario: ${escapeMarkdown(input.scenario.name)} (${escapeMarkdown(input.scenario.id)})`,
    "",
    "## Inputs",
    "",
    "| Id | Role | Dimension | SI value | Display value |",
    "|---|---|---|---:|---:|"
  ];
  for (const item of input.inputs) {
    lines.push(
      `| ${escapeMarkdown(item.id)} | ${escapeMarkdown(item.role)} | ${escapeMarkdown(getEngineeringDimensionLabel(item.dimension))} | ` +
      `${escapeMarkdown(formatMeasurement(item.siValue, item.siUnitId))} | ` +
      `${escapeMarkdown(formatMeasurement(item.displayValue, item.displayUnitId))} |`
    );
  }
  lines.push("", "## Assumptions and tolerances", "");
  appendList(lines, "Assumptions", input.assumptions);
  appendList(lines, "Tolerances", input.tolerances);
  lines.push(
    "## Calculation and model versions",
    "",
    "| Id | Algorithm | Version | Equation |",
    "|---|---|---:|---|"
  );
  for (const model of input.models) {
    lines.push(
      `| ${escapeMarkdown(model.id)} | ${escapeMarkdown(model.algorithmId)} | ` +
      `${escapeMarkdown(model.modelVersion)} | ${escapeMarkdown(model.equation)} |`
    );
  }
  lines.push("", "## Dataset provenance", "", "| Dataset | Source | SHA-256 | Provenance |", "|---|---|---|---|");
  for (const dataset of input.datasets) {
    lines.push(
      `| ${escapeMarkdown(dataset.id)} | ${escapeMarkdown(dataset.source)} | ` +
      `\`${dataset.contentSha256}\` | ${escapeMarkdown(dataset.provenance)} |`
    );
  }
  lines.push("", "## Results", "", "| Result | Value | Status |", "|---|---:|---|");
  for (const result of input.results) {
    lines.push(
      `| ${escapeMarkdown(result.label)} | ${escapeMarkdown(formatMeasurement(result.value, result.unitId))} | ` +
      `${escapeMarkdown(result.status)} |`
    );
  }
  lines.push("");
  for (const chart of input.charts) appendChartTable(lines, chart);
  appendList(lines, "Validation", input.validation);
  appendList(lines, "Warnings", input.warnings);
  appendList(lines, "Known limits", input.limits);
  appendList(lines, "Lineage", input.lineage);
  lines.push("## Environment", "", "| Component | Version or state |", "|---|---|");
  for (const [name, version] of Object.entries(input.environment)) {
    lines.push(`| ${escapeMarkdown(name)} | ${escapeMarkdown(version)} |`);
  }
  lines.push(
    "",
    "## Integrity",
    "",
    `- Algorithm: ${input.integrity.algorithm}`,
    `- Project pack SHA-256: \`${input.integrity.projectPackSha256}\``,
    `- Report source SHA-256: \`${input.integrity.reportSourceSha256}\``,
    ""
  );
  return lines.join("\n");
}

function appendChartTable(lines: string[], chart: AccessibleChartTable): void {
  lines.push(`### Chart data: ${escapeMarkdown(chart.title)}`, "");
  lines.push(`| ${chart.columns.map(escapeMarkdown).join(" | ")} |`);
  lines.push(`| ${chart.columns.map(() => "---").join(" | ")} |`);
  for (const row of chart.rows) {
    lines.push(`| ${row.map((cell) =>
      cell === null ? "" : escapeMarkdown(typeof cell === "number" ? formatNumber(cell) : cell)
    ).join(" | ")} |`);
  }
  lines.push("");
}

function appendList(lines: string[], title: string, values: string[]): void {
  lines.push(`### ${title}`, "");
  if (values.length === 0) lines.push("- None recorded.");
  else values.forEach((value) => lines.push(`- ${escapeMarkdown(value)}`));
  lines.push("");
}

function sortStringRecord(value: Record<string, string>): Record<string, string> {
  const output: Record<string, string> = Object.create(null) as Record<string, string>;
  Object.keys(value).sort(compareText).forEach((key) => {
    output[key] = value[key];
  });
  return output;
}

function ensureUniqueIds(items: ReadonlyArray<{ id: string }>, path: string): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`${path} contains duplicate id ${item.id}`);
    ids.add(item.id);
  }
}

function validateUtc(value: unknown, path: string): string {
  const timestamp = requireText(value, path, 40);
  const date = new Date(timestamp);
  if (!timestamp.endsWith("Z") || Number.isNaN(date.valueOf()) || date.toISOString() !== timestamp) {
    throw new Error(`${path} must be an exact ISO-8601 UTC timestamp`);
  }
  return timestamp;
}

function formatNumber(value: number): string {
  if (Object.is(value, -0)) return "0";
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
  return value.toPrecision(12).replace(/(?:\.0+|(\.\d+?)0+)(e|$)/, "$1$2");
}

function formatMeasurement(value: number, unitId: string): string {
  const symbol = getEngineeringUnitSymbol(unitId);
  return `${formatNumber(value)}${symbol ? ` ${symbol}` : ""}`;
}

function escapeMarkdown(value: string): string {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/[!-/:-@[-`{-~]/g, "\\$&");
}

function compareId<T extends { id: string }>(left: T, right: T): number {
  return compareText(left.id, right.id);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
