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
import academyLessonTeachingProfilesV2E3D20, {
  academyLessonTeachingProfileV2LessonIdsE3D20,
  academyLessonTeachingProfileV2PlansE3D20
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D20";
import academyLessonTeachingProfilesV2E3D21, {
  academyLessonTeachingProfileV2LessonIdsE3D21,
  academyLessonTeachingProfileV2PlansE3D21
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E3-D21";

const units = [
  {
    unitId: "EML-E3-D20",
    profiles: academyLessonTeachingProfilesV2E3D20,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE3D20,
    plans: academyLessonTeachingProfileV2PlansE3D20
  },
  {
    unitId: "EML-E3-D21",
    profiles: academyLessonTeachingProfilesV2E3D21,
    lessonIds: academyLessonTeachingProfileV2LessonIdsE3D21,
    plans: academyLessonTeachingProfileV2PlansE3D21
  }
] as const;

const combinedRegistry = Object.assign(
  {},
  ...units.map((unit) => unit.profiles)
) as AcademyLessonTeachingProfileV2Registry;

const combinedLessonIds = units.flatMap((unit) => [...unit.lessonIds]);
const combinedPlans = units.flatMap((unit) => [...unit.plans]);

const catalogueSignals = [
  ["EML-E3-D20-L01", /encoder.*odometry/iu],
  ["EML-E3-D20-L02", /localisation.*pose/iu],
  ["EML-E3-D20-L03", /occupancy.*map/iu],
  ["EML-E3-D20-L04", /simultaneous localisation and mapping.*graph/iu],
  ["EML-E3-D20-L05", /planners.*cost/iu],
  ["EML-E3-D20-L06", /trajectory.*motion control/iu],
  ["EML-E3-D20-L07", /nav2.*behaviour/iu],
  ["EML-E3-D21-L01", /camera.*perspective/iu],
  ["EML-E3-D21-L02", /pixels.*colour.*filters/iu],
  ["EML-E3-D21-L03", /camera calibration.*distortion/iu],
  ["EML-E3-D21-L04", /projective geometry.*homogeneous/iu],
  ["EML-E3-D21-L05", /feature detector.*descriptor.*matching/iu],
  ["EML-E3-D21-L06", /depth and pose.*rays/iu],
  ["EML-E3-D21-L07", /robot vision.*latency.*fallback/iu]
] as const;

describe("E3 D20-D21 academy lesson teaching profiles V2", () => {
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

  it("keeps every D20-D21 lesson native, bounded and specific", () => {
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

  it("follows the live D20-D21 catalogue sequence", () => {
    catalogueSignals.forEach(([lessonId, signal]) => {
      const profile = combinedRegistry[lessonId];
      expect(profile).toBeDefined();
      expect(
        `${profile?.systemModel ?? ""} ${profile?.applicationTask ?? ""}`
      ).toMatch(signal);
    });
  });

  it("materialises one combined 14-lesson registry without hidden templates", () => {
    expect(combinedLessonIds).toHaveLength(14);
    expect(new Set(combinedLessonIds).size).toBe(14);
    expect(Object.keys(combinedRegistry)).toHaveLength(14);
    expect(validateAcademyLessonTeachingProfileV2Registry(combinedRegistry))
      .toEqual([]);
    expect(
      Object.keys(
        materialiseAcademyLessonTeachingProfileV2Registry(
          combinedLessonIds,
          combinedPlans
        )
      )
    ).toHaveLength(14);
  });
});
