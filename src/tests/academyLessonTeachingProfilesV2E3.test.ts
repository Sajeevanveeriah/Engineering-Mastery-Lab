import { describe, expect, it } from "vitest";
import type {
  AcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2";
import {
  profileUsesRejectedGenericShell,
  validateAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Validation";
import academyLessonTeachingProfilesV2E3D17 from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D17";
import academyLessonTeachingProfilesV2E3D18 from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D18";
import academyLessonTeachingProfilesV2E3D19 from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D19";
import academyLessonTeachingProfilesV2E3D20 from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D20";
import academyLessonTeachingProfilesV2E3D21 from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D21";
import academyLessonTeachingProfilesV2E3D22 from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D22";
import academyLessonTeachingProfilesV2E3D23 from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D23";

const units = [
  {
    unitId: "EML-E3-D17",
    profiles: academyLessonTeachingProfilesV2E3D17
  },
  {
    unitId: "EML-E3-D18",
    profiles: academyLessonTeachingProfilesV2E3D18
  },
  {
    unitId: "EML-E3-D19",
    profiles: academyLessonTeachingProfilesV2E3D19
  },
  {
    unitId: "EML-E3-D20",
    profiles: academyLessonTeachingProfilesV2E3D20
  },
  {
    unitId: "EML-E3-D21",
    profiles: academyLessonTeachingProfilesV2E3D21
  },
  {
    unitId: "EML-E3-D22",
    profiles: academyLessonTeachingProfilesV2E3D22
  },
  {
    unitId: "EML-E3-D23",
    profiles: academyLessonTeachingProfilesV2E3D23
  }
] as const;

const expectedLessonIdsFor = (unitId: string): string[] =>
  Array.from(
    { length: 7 },
    (_, index) => `${unitId}-L${String(index + 1).padStart(2, "0")}`
  );

const expectedLessonIds = units.flatMap(({ unitId }) =>
  expectedLessonIdsFor(unitId)
);

const academyLessonTeachingProfilesV2E3 = Object.freeze(
  Object.assign({}, ...units.map(({ profiles }) => profiles))
) as AcademyLessonTeachingProfileV2Registry;

describe("E3 academy lesson teaching profiles V2", () => {
  it.each(units)(
    "materialises the exact seven authored lessons for $unitId",
    ({ unitId, profiles }) => {
      const expectedUnitLessonIds = expectedLessonIdsFor(unitId);
      expect(Object.keys(profiles)).toEqual(expectedUnitLessonIds);
      expect(validateAcademyLessonTeachingProfileV2Registry(profiles))
        .toEqual([]);
    }
  );

  it("keeps every E3 lesson native, bounded and free of remote or forbidden-dash copy", () => {
    Object.values(academyLessonTeachingProfilesV2E3).forEach((profile) => {
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

  it("validates one exact 49-lesson E3 registry without hidden templates", () => {
    expect(expectedLessonIds).toHaveLength(49);
    expect(new Set(expectedLessonIds).size).toBe(49);
    expect(Object.keys(academyLessonTeachingProfilesV2E3))
      .toEqual(expectedLessonIds);
    expect(validateAcademyLessonTeachingProfileV2Registry(
      academyLessonTeachingProfilesV2E3
    )).toEqual([]);
  });
});
