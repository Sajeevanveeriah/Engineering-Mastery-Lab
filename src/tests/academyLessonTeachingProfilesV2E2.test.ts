import { describe, expect, it } from "vitest";
import type {
  AcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2";
import {
  materialiseAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Authoring";
import {
  profileUsesRejectedGenericShell,
  validateAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Validation";
import academyLessonTeachingProfilesV2E2D09, {
  academyLessonTeachingProfileV2LessonIdsE2D09,
  academyLessonTeachingProfileV2PlansE2D09
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D09";
import academyLessonTeachingProfilesV2E2D10, {
  academyLessonTeachingProfileV2LessonIdsE2D10,
  academyLessonTeachingProfileV2PlansE2D10
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D10";
import academyLessonTeachingProfilesV2E2D11, {
  academyLessonTeachingProfileV2LessonIdsE2D11,
  academyLessonTeachingProfileV2PlansE2D11
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D11";
import academyLessonTeachingProfilesV2E2D12, {
  academyLessonTeachingProfileV2LessonIdsE2D12,
  academyLessonTeachingProfileV2PlansE2D12
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D12";
import academyLessonTeachingProfilesV2E2D13, {
  academyLessonTeachingProfileV2LessonIdsE2D13,
  academyLessonTeachingProfileV2PlansE2D13
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D13";
import academyLessonTeachingProfilesV2E2D14, {
  academyLessonTeachingProfileV2LessonIdsE2D14,
  academyLessonTeachingProfileV2PlansE2D14
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D14";
import academyLessonTeachingProfilesV2E2D15, {
  academyLessonTeachingProfileV2LessonIdsE2D15,
  academyLessonTeachingProfileV2PlansE2D15
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D15";
import academyLessonTeachingProfilesV2E2D16, {
  academyLessonTeachingProfileV2LessonIdsE2D16,
  academyLessonTeachingProfileV2PlansE2D16
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E2-D16";

const units = [
  {
    unitId: "EML-E2-D09",
    profiles: academyLessonTeachingProfilesV2E2D09,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D09,
    plans: academyLessonTeachingProfileV2PlansE2D09
  },
  {
    unitId: "EML-E2-D10",
    profiles: academyLessonTeachingProfilesV2E2D10,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D10,
    plans: academyLessonTeachingProfileV2PlansE2D10
  },
  {
    unitId: "EML-E2-D11",
    profiles: academyLessonTeachingProfilesV2E2D11,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D11,
    plans: academyLessonTeachingProfileV2PlansE2D11
  },
  {
    unitId: "EML-E2-D12",
    profiles: academyLessonTeachingProfilesV2E2D12,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D12,
    plans: academyLessonTeachingProfileV2PlansE2D12
  },
  {
    unitId: "EML-E2-D13",
    profiles: academyLessonTeachingProfilesV2E2D13,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D13,
    plans: academyLessonTeachingProfileV2PlansE2D13
  },
  {
    unitId: "EML-E2-D14",
    profiles: academyLessonTeachingProfilesV2E2D14,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D14,
    plans: academyLessonTeachingProfileV2PlansE2D14
  },
  {
    unitId: "EML-E2-D15",
    profiles: academyLessonTeachingProfilesV2E2D15,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D15,
    plans: academyLessonTeachingProfileV2PlansE2D15
  },
  {
    unitId: "EML-E2-D16",
    profiles: academyLessonTeachingProfilesV2E2D16,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE2D16,
    plans: academyLessonTeachingProfileV2PlansE2D16
  }
] as const;

const combinedRegistry = Object.assign(
  {},
  ...units.map((unit) => unit.profiles)
) as AcademyLessonTeachingProfileV2Registry;

const combinedLessonIds = units.flatMap((unit) => [...unit.lessonIds]);
const combinedPlans = units.flatMap((unit) => [...unit.plans]);

describe("E2 academy lesson teaching profiles V2", () => {
  it.each(units)(
    "materialises all seven authored lessons for $unitId",
    ({ unitId, profiles, lessonIds, plans }) => {
      expect(plans).toHaveLength(7);
      expect(lessonIds).toEqual(
        Array.from(
          { length: 7 },
          (_, index) => `${unitId}-L${String(index + 1).padStart(2, "0")}`
        )
      );
      expect(Object.keys(profiles).sort()).toEqual([...lessonIds].sort());
      expect(validateAcademyLessonTeachingProfileV2Registry(profiles))
        .toEqual([]);
    }
  );

  it("keeps every E2 lesson native, bounded and structurally specific", () => {
    Object.values(combinedRegistry).forEach((profile) => {
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
    });
  });

  it("validates one complete 56-lesson E2 registry without hidden templates", () => {
    expect(combinedLessonIds).toHaveLength(56);
    expect(new Set(combinedLessonIds).size).toBe(56);
    expect(Object.keys(combinedRegistry)).toHaveLength(56);
    expect(validateAcademyLessonTeachingProfileV2Registry(combinedRegistry))
      .toEqual([]);
    expect(
      Object.keys(
        materialiseAcademyLessonTeachingProfileV2Registry(
          combinedLessonIds,
          combinedPlans
        )
      )
    ).toHaveLength(56);
  });
});
