import { describe, expect, it } from "vitest";
import { academyUnits } from "../data/academy/catalogue";
import type {
  AcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2";
import {
  profileUsesRejectedGenericShell,
  validateAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Validation";
import {
  loadAcademyLessonTeachingProfileV2UnitForLesson,
  validateLoadedAcademyLessonTeachingProfileV2Unit,
  type AcademyLessonTeachingProfileV2UnitModule
} from "../lib/academy/lessonTeachingProfileV2Loader";

const unitModules =
  import.meta.glob<AcademyLessonTeachingProfileV2UnitModule>(
    "../data/academy/lessonTeachingProfilesV2/units/*.ts",
    { eager: true }
  );

const modulePathForUnit = (unitId: string): string =>
  `../data/academy/lessonTeachingProfilesV2/units/${unitId}.ts`;

describe("complete Academy lesson teaching profile V2 registry", () => {
  it("contains one exact validated seven-lesson module for all 25 units", () => {
    expect(Object.keys(unitModules).sort()).toEqual(
      academyUnits.map((unit) => modulePathForUnit(unit.id)).sort()
    );

    for (const unit of academyUnits) {
      const unitModule = unitModules[modulePathForUnit(unit.id)];
      expect(unitModule).toBeDefined();
      expect(Object.keys(unitModule.default).sort()).toEqual(
        [...unit.lessonIds].sort()
      );
      expect(
        validateLoadedAcademyLessonTeachingProfileV2Unit(
          unit.id,
          unitModule.default
        )
      ).toBe(unitModule.default);
    }
  });

  it("validates all 175 native profiles together without duplicates or shells", () => {
    const combinedRegistry = Object.assign(
      {},
      ...academyUnits.map(
        (unit) => unitModules[modulePathForUnit(unit.id)].default
      )
    ) as AcademyLessonTeachingProfileV2Registry;
    const expectedLessonIds = academyUnits.flatMap(
      (unit) => [...unit.lessonIds]
    );

    expect(academyUnits).toHaveLength(25);
    expect(expectedLessonIds).toHaveLength(175);
    expect(new Set(expectedLessonIds).size).toBe(175);
    expect(Object.keys(combinedRegistry).sort()).toEqual(
      [...expectedLessonIds].sort()
    );
    expect(validateAcademyLessonTeachingProfileV2Registry(combinedRegistry))
      .toEqual([]);

    for (const profile of Object.values(combinedRegistry)) {
      const serialised = JSON.stringify(profile);
      expect(profile.reasonedCases.some((entry) => entry.kind === "example"))
        .toBe(true);
      expect(
        profile.reasonedCases.some((entry) => entry.kind === "counterexample")
      ).toBe(true);
      expect(profile.explorer.controls.length).toBeGreaterThanOrEqual(2);
      expect(profileUsesRejectedGenericShell(profile)).toBe(false);
      expect(serialised).not.toMatch(/https?:\/\//u);
      expect(serialised).not.toMatch(/[\u2013\u2014]/u);
      const textEquivalents = [
        ...profile.explorer.controls.map((control) => control.textEquivalent),
        ...(["base", "retry"] as const).flatMap((mode) => {
          const scenario = profile.assessments.q5[mode];
          return scenario.kind === "diagram" ? [scenario.textEquivalent] : [];
        })
      ];
      for (const textEquivalent of textEquivalents) {
        expect(textEquivalent, profile.lessonId).not.toMatch(
          /(?:[.!?];|[.;:!?]{2})/u
        );
      }
    }
  });

  it("lazy-loads and resumes every canonical lesson through its unit boundary", async () => {
    for (const unit of academyUnits) {
      for (const lessonId of unit.lessonIds) {
        const loaded =
          await loadAcademyLessonTeachingProfileV2UnitForLesson(lessonId);

        expect(loaded.unitId).toBe(unit.id);
        expect(loaded.lessonIds).toEqual(unit.lessonIds);
        expect(loaded.profile.lessonId).toBe(lessonId);
        expect(Object.keys(loaded.registry).sort()).toEqual(
          [...unit.lessonIds].sort()
        );
      }
    }
  });
});
