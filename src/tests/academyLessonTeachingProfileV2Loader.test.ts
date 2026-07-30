import { readFileSync } from "node:fs";
import type {
  AcademyLessonTeachingProfileV2,
  AcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2";
import {
  AcademyLessonTeachingProfileV2LoaderError,
  loadAcademyLessonTeachingProfileV2UnitForLesson,
  resolveAcademyLessonTeachingProfileV2Unit,
  validateLoadedAcademyLessonTeachingProfileV2Unit
} from "../lib/academy/lessonTeachingProfileV2Loader";

const asProfile = (lessonId: string): AcademyLessonTeachingProfileV2 =>
  ({ lessonId }) as AcademyLessonTeachingProfileV2;

const registryFor = (
  lessonIds: readonly string[]
): AcademyLessonTeachingProfileV2Registry =>
  Object.fromEntries(
    lessonIds.map((lessonId) => [lessonId, asProfile(lessonId)])
  );

const captureLoaderError = (
  action: () => unknown
): AcademyLessonTeachingProfileV2LoaderError => {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(AcademyLessonTeachingProfileV2LoaderError);
    return error as AcademyLessonTeachingProfileV2LoaderError;
  }
  throw new Error("Expected the loader boundary to fail closed.");
};

describe("Academy lesson teaching profile V2 unit loader", () => {
  it("resolves a lesson through the canonical catalogue to one exact unit chunk", () => {
    expect(
      resolveAcademyLessonTeachingProfileV2Unit("EML-E2-D09-L04")
    ).toEqual({
      lessonId: "EML-E2-D09-L04",
      unitId: "EML-E2-D09",
      lessonIds: [
        "EML-E2-D09-L01",
        "EML-E2-D09-L02",
        "EML-E2-D09-L03",
        "EML-E2-D09-L04",
        "EML-E2-D09-L05",
        "EML-E2-D09-L06",
        "EML-E2-D09-L07"
      ],
      modulePath:
        "../../data/academy/lessonTeachingProfilesV2/units/EML-E2-D09.ts"
    });
  });

  it("uses a literal lazy Vite glob without importing authoring code eagerly", () => {
    const loaderSource = readFileSync(
      new URL(
        "../lib/academy/lessonTeachingProfileV2Loader.ts",
        import.meta.url
      ),
      "utf8"
    );
    expect(loaderSource).toContain(
      'import.meta.glob<AcademyLessonTeachingProfileV2UnitModule>(\n'
      + '    "../../data/academy/lessonTeachingProfilesV2/units/*.ts"\n'
      + "  )"
    );
    expect(loaderSource).not.toContain("lessonTeachingProfileV2Authoring");
    expect(loaderSource).not.toContain("eager:");
  });

  it("lazy-loads each authored E0 unit and resumes the exact lesson", async () => {
    const requestedLessons = [
      ["EML-E0-D01-L01", "EML-E0-D01"],
      ["EML-E0-D02-L04", "EML-E0-D02"],
      ["EML-E0-D03-L06", "EML-E0-D03"]
    ] as const;

    for (const [lessonId, unitId] of requestedLessons) {
      const loaded =
        await loadAcademyLessonTeachingProfileV2UnitForLesson(lessonId);

      expect(loaded).toMatchObject({
        unitId,
        profile: {
          lessonId
        }
      });
      expect(loaded.lessonIds).toHaveLength(7);
      expect(Object.keys(loaded.registry).sort()).toEqual(
        [...loaded.lessonIds].sort()
      );
    }
  });

  it("rejects missing, orphan and duplicate lessons before aggregate validation", () => {
    const expectedLessonIds =
      resolveAcademyLessonTeachingProfileV2Unit(
        "EML-E0-D01-L01"
      ).lessonIds;

    const missingError = captureLoaderError(() =>
      validateLoadedAcademyLessonTeachingProfileV2Unit(
        "EML-E0-D01",
        registryFor(expectedLessonIds.slice(0, -1))
      )
    );
    expect(missingError).toMatchObject({
      code: "missing-lesson",
      lessonIds: ["EML-E0-D01-L07"]
    });

    const orphanError = captureLoaderError(() =>
      validateLoadedAcademyLessonTeachingProfileV2Unit(
        "EML-E0-D01",
        {
          ...registryFor(expectedLessonIds),
          "EML-E0-D02-L01": asProfile("EML-E0-D02-L01")
        }
      )
    );
    expect(orphanError).toMatchObject({
      code: "orphan-lesson",
      lessonIds: ["EML-E0-D02-L01"]
    });

    const duplicateError = captureLoaderError(() =>
      validateLoadedAcademyLessonTeachingProfileV2Unit(
        "EML-E0-D01",
        {
          ...registryFor(expectedLessonIds),
          "EML-E0-D01-L01-DUPLICATE": asProfile("EML-E0-D01-L01")
        }
      )
    );
    expect(duplicateError).toMatchObject({
      code: "duplicate-lesson",
      lessonIds: ["EML-E0-D01-L01"]
    });
  });

  it("rejects lesson IDs that do not belong to the canonical catalogue", () => {
    const error = captureLoaderError(() =>
      resolveAcademyLessonTeachingProfileV2Unit("EML-E9-D99-L01")
    );
    expect(error).toMatchObject({
      code: "unknown-lesson",
      unitId: null,
      lessonIds: []
    });
  });
});
