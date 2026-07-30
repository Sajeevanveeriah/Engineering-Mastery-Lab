import { academyUnits } from "../../data/academy/catalogue";
import type {
  AcademyLessonTeachingProfileV2,
  AcademyLessonTeachingProfileV2Registry
} from "../../data/academy/lessonTeachingProfileV2";
import {
  AcademyLessonProfileV2ValidationError,
  validateAcademyLessonTeachingProfileV2Registry
} from "../../data/academy/lessonTeachingProfileV2Validation";

export interface AcademyLessonTeachingProfileV2UnitModule {
  readonly default: AcademyLessonTeachingProfileV2Registry;
}

export type AcademyLessonTeachingProfileV2LoaderErrorCode =
  | "unknown-lesson"
  | "missing-unit-module"
  | "invalid-unit-module"
  | "missing-lesson"
  | "orphan-lesson"
  | "duplicate-lesson";

export class AcademyLessonTeachingProfileV2LoaderError extends Error {
  readonly code: AcademyLessonTeachingProfileV2LoaderErrorCode;
  readonly unitId: string | null;
  readonly lessonIds: readonly string[];

  constructor(
    code: AcademyLessonTeachingProfileV2LoaderErrorCode,
    message: string,
    unitId: string | null = null,
    lessonIds: readonly string[] = []
  ) {
    super(message);
    this.name = "AcademyLessonTeachingProfileV2LoaderError";
    this.code = code;
    this.unitId = unitId;
    this.lessonIds = [...lessonIds];
  }
}

export interface AcademyLessonTeachingProfileV2UnitResolution {
  readonly lessonId: string;
  readonly unitId: string;
  readonly lessonIds: readonly string[];
  readonly modulePath: string;
}

export interface LoadedAcademyLessonTeachingProfileV2Unit
  extends AcademyLessonTeachingProfileV2UnitResolution {
  readonly registry: AcademyLessonTeachingProfileV2Registry;
  readonly profile: AcademyLessonTeachingProfileV2;
}

const academyLessonTeachingProfileV2UnitModuleLoaders =
  import.meta.glob<AcademyLessonTeachingProfileV2UnitModule>(
    "../../data/academy/lessonTeachingProfilesV2/units/*.ts"
  );

const modulePathForUnit = (unitId: string): string =>
  `../../data/academy/lessonTeachingProfilesV2/units/${unitId}.ts`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const canonicalUnit = (unitId: string) =>
  academyUnits.find((unit) => unit.id === unitId);

export const resolveAcademyLessonTeachingProfileV2Unit = (
  lessonId: string
): AcademyLessonTeachingProfileV2UnitResolution => {
  const unit = academyUnits.find((candidate) =>
    candidate.lessonIds.includes(lessonId)
  );
  if (!unit) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "unknown-lesson",
      `Lesson "${lessonId}" does not belong to a canonical Academy unit.`
    );
  }
  return {
    lessonId,
    unitId: unit.id,
    lessonIds: [...unit.lessonIds],
    modulePath: modulePathForUnit(unit.id)
  };
};

export const validateLoadedAcademyLessonTeachingProfileV2Unit = (
  unitId: string,
  registry: AcademyLessonTeachingProfileV2Registry
): AcademyLessonTeachingProfileV2Registry => {
  const unit = canonicalUnit(unitId);
  if (!unit) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "orphan-lesson",
      `Unit "${unitId}" is not present in the canonical Academy catalogue.`,
      unitId
    );
  }

  const entries = Object.entries(registry);
  const malformedKeys = entries
    .filter(([, profile]) =>
      !isRecord(profile) || typeof profile.lessonId !== "string"
    )
    .map(([registryKey]) => registryKey);
  if (malformedKeys.length > 0) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "invalid-unit-module",
      `Unit "${unitId}" exports entries without string lesson IDs.`,
      unitId,
      malformedKeys
    );
  }

  const lessonIds = entries.map(([, profile]) => profile.lessonId);
  const lessonIdCounts = new Map<string, number>();
  lessonIds.forEach((lessonId) =>
    lessonIdCounts.set(lessonId, (lessonIdCounts.get(lessonId) ?? 0) + 1)
  );
  const duplicateLessonIds = [...lessonIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([lessonId]) => lessonId)
    .sort();
  if (duplicateLessonIds.length > 0) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "duplicate-lesson",
      `Unit "${unitId}" exports duplicate lesson profiles.`,
      unitId,
      duplicateLessonIds
    );
  }

  const expectedLessonIds = new Set(unit.lessonIds);
  const orphanLessonIds = entries
    .flatMap(([registryKey, profile]) => [registryKey, profile.lessonId])
    .filter((lessonId) => !expectedLessonIds.has(lessonId));
  const uniqueOrphanLessonIds = [...new Set(orphanLessonIds)].sort();
  if (uniqueOrphanLessonIds.length > 0) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "orphan-lesson",
      `Unit "${unitId}" exports lessons outside its canonical seven-lesson boundary.`,
      unitId,
      uniqueOrphanLessonIds
    );
  }

  const registryKeys = new Set(entries.map(([registryKey]) => registryKey));
  const exportedLessonIds = new Set(lessonIds);
  const missingLessonIds = unit.lessonIds.filter((lessonId) =>
    !registryKeys.has(lessonId) || !exportedLessonIds.has(lessonId)
  );
  if (missingLessonIds.length > 0) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "missing-lesson",
      `Unit "${unitId}" does not export every canonical lesson profile.`,
      unitId,
      missingLessonIds
    );
  }

  const issues = validateAcademyLessonTeachingProfileV2Registry(registry);
  if (issues.length > 0) {
    throw new AcademyLessonProfileV2ValidationError(issues);
  }
  return registry;
};

export const loadAcademyLessonTeachingProfileV2UnitForLesson = async (
  lessonId: string
): Promise<LoadedAcademyLessonTeachingProfileV2Unit> => {
  const resolution = resolveAcademyLessonTeachingProfileV2Unit(lessonId);
  const loadModule =
    academyLessonTeachingProfileV2UnitModuleLoaders[resolution.modulePath];
  if (!loadModule) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "missing-unit-module",
      `No Academy lesson teaching profile V2 module exists for unit "${resolution.unitId}".`,
      resolution.unitId,
      resolution.lessonIds
    );
  }

  const loadedModule: unknown = await loadModule();
  if (
    !isRecord(loadedModule)
    || !("default" in loadedModule)
    || !isRecord(loadedModule.default)
  ) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "invalid-unit-module",
      `The Academy lesson teaching profile V2 module for unit "${resolution.unitId}" has no default registry export.`,
      resolution.unitId
    );
  }

  const registry = validateLoadedAcademyLessonTeachingProfileV2Unit(
    resolution.unitId,
    loadedModule.default as AcademyLessonTeachingProfileV2Registry
  );
  const profile = registry[lessonId];
  if (!profile) {
    throw new AcademyLessonTeachingProfileV2LoaderError(
      "missing-lesson",
      `The validated unit "${resolution.unitId}" does not contain lesson "${lessonId}".`,
      resolution.unitId,
      [lessonId]
    );
  }
  return {
    ...resolution,
    registry,
    profile
  };
};
