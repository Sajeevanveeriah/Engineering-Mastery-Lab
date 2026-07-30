import { describe, expect, it } from "vitest";
import type {
  AcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2";
import academyLessonTeachingProfilesV2E1D04, {
  academyLessonTeachingProfileV2LessonIdsE1D04,
  academyLessonTeachingProfileV2PlansE1D04
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E1-D04";
import academyLessonTeachingProfilesV2E1D05, {
  academyLessonTeachingProfileV2LessonIdsE1D05,
  academyLessonTeachingProfileV2PlansE1D05
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E1-D05";
import academyLessonTeachingProfilesV2E1D06, {
  academyLessonTeachingProfileV2LessonIdsE1D06,
  academyLessonTeachingProfileV2PlansE1D06
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E1-D06";
import academyLessonTeachingProfilesV2E1D07, {
  academyLessonTeachingProfileV2LessonIdsE1D07,
  academyLessonTeachingProfileV2PlansE1D07
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E1-D07";
import academyLessonTeachingProfilesV2E1D08, {
  academyLessonTeachingProfileV2LessonIdsE1D08,
  academyLessonTeachingProfileV2PlansE1D08
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E1-D08";
import {
  materialiseAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Authoring";
import {
  profileUsesRejectedGenericShell,
  validateAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Validation";

const unitRegistries = [
  academyLessonTeachingProfilesV2E1D04,
  academyLessonTeachingProfilesV2E1D05,
  academyLessonTeachingProfilesV2E1D06,
  academyLessonTeachingProfilesV2E1D07,
  academyLessonTeachingProfilesV2E1D08
] as const;

const combinedRegistry = Object.assign(
  {},
  ...unitRegistries
) as AcademyLessonTeachingProfileV2Registry;

const combinedLessonIds = [
  ...academyLessonTeachingProfileV2LessonIdsE1D04,
  ...academyLessonTeachingProfileV2LessonIdsE1D05,
  ...academyLessonTeachingProfileV2LessonIdsE1D06,
  ...academyLessonTeachingProfileV2LessonIdsE1D07,
  ...academyLessonTeachingProfileV2LessonIdsE1D08
];

const combinedPlans = [
  ...academyLessonTeachingProfileV2PlansE1D04,
  ...academyLessonTeachingProfileV2PlansE1D05,
  ...academyLessonTeachingProfileV2PlansE1D06,
  ...academyLessonTeachingProfileV2PlansE1D07,
  ...academyLessonTeachingProfileV2PlansE1D08
];

describe("E1 academy lesson teaching profiles V2", () => {
  it("materialises all authored D04 compact plans", () => {
    expect(academyLessonTeachingProfileV2PlansE1D04).toHaveLength(7);
    expect(Object.keys(academyLessonTeachingProfilesV2E1D04).sort()).toEqual(
      [...academyLessonTeachingProfileV2LessonIdsE1D04].sort()
    );
    expect(
      validateAcademyLessonTeachingProfileV2Registry(
        academyLessonTeachingProfilesV2E1D04
      )
    ).toEqual([]);
  });

  it("materialises all authored D05 compact plans", () => {
    expect(academyLessonTeachingProfileV2PlansE1D05).toHaveLength(7);
    expect(Object.keys(academyLessonTeachingProfilesV2E1D05).sort()).toEqual(
      [...academyLessonTeachingProfileV2LessonIdsE1D05].sort()
    );
    expect(
      validateAcademyLessonTeachingProfileV2Registry(
        academyLessonTeachingProfilesV2E1D05
      )
    ).toEqual([]);
  });

  it("materialises all authored D06 compact plans", () => {
    expect(academyLessonTeachingProfileV2PlansE1D06).toHaveLength(7);
    expect(Object.keys(academyLessonTeachingProfilesV2E1D06).sort()).toEqual(
      [...academyLessonTeachingProfileV2LessonIdsE1D06].sort()
    );
    expect(
      validateAcademyLessonTeachingProfileV2Registry(
        academyLessonTeachingProfilesV2E1D06
      )
    ).toEqual([]);
  });

  it("materialises all authored D07 compact plans", () => {
    expect(academyLessonTeachingProfileV2PlansE1D07).toHaveLength(7);
    expect(Object.keys(academyLessonTeachingProfilesV2E1D07).sort()).toEqual(
      [...academyLessonTeachingProfileV2LessonIdsE1D07].sort()
    );
    expect(
      validateAcademyLessonTeachingProfileV2Registry(
        academyLessonTeachingProfilesV2E1D07
      )
    ).toEqual([]);
  });

  it("materialises all authored D08 compact plans", () => {
    expect(academyLessonTeachingProfileV2PlansE1D08).toHaveLength(7);
    expect(Object.keys(academyLessonTeachingProfilesV2E1D08).sort()).toEqual(
      [...academyLessonTeachingProfileV2LessonIdsE1D08].sort()
    );
    expect(
      validateAcademyLessonTeachingProfileV2Registry(
        academyLessonTeachingProfilesV2E1D08
      )
    ).toEqual([]);
  });

  it("keeps every current E1 profile native, bounded and structurally specific", () => {
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

  it("validates the current combined E1 registry without duplicate information", () => {
    expect(Object.keys(combinedRegistry)).toHaveLength(35);
    expect(new Set(combinedLessonIds).size).toBe(35);
    expect(
      combinedLessonIds.every((lessonId) =>
        /^EML-E1-D0[4-8]-L0[1-7]$/u.test(lessonId)
      )
    ).toBe(true);
    expect(validateAcademyLessonTeachingProfileV2Registry(combinedRegistry))
      .toEqual([]);
    expect(
      Object.keys(
        materialiseAcademyLessonTeachingProfileV2Registry(
          combinedLessonIds,
          combinedPlans
        )
      )
    ).toHaveLength(35);
  });
});
