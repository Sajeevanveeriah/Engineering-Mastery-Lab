import { describe, expect, it } from "vitest";
import d01Profiles from "../data/academy/lessonTeachingProfilesV2/units/EML-E0-D01";
import d02Profiles from "../data/academy/lessonTeachingProfilesV2/units/EML-E0-D02";
import d03Profiles from "../data/academy/lessonTeachingProfilesV2/units/EML-E0-D03";
import {
  validateAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Validation";

const expectedLessonIds = [
  "EML-E0-D01-L01",
  "EML-E0-D01-L02",
  "EML-E0-D01-L03",
  "EML-E0-D01-L04",
  "EML-E0-D01-L05",
  "EML-E0-D01-L06",
  "EML-E0-D01-L07",
  "EML-E0-D02-L01",
  "EML-E0-D02-L02",
  "EML-E0-D02-L03",
  "EML-E0-D02-L04",
  "EML-E0-D02-L05",
  "EML-E0-D02-L06",
  "EML-E0-D02-L07",
  "EML-E0-D03-L01",
  "EML-E0-D03-L02",
  "EML-E0-D03-L03",
  "EML-E0-D03-L04",
  "EML-E0-D03-L05",
  "EML-E0-D03-L06",
  "EML-E0-D03-L07"
] as const;

describe("E0 lesson teaching profile V2 registry", () => {
  it("contains exactly the authored E0 lessons and validates as one registry", () => {
    const registry = {
      ...d01Profiles,
      ...d02Profiles,
      ...d03Profiles
    };

    expect(Object.keys(registry).sort()).toEqual([...expectedLessonIds].sort());
    expect(validateAcademyLessonTeachingProfileV2Registry(registry)).toEqual(
      []
    );
  });

  it("keeps the D03 beginner boundaries explicit in teaching and practice", () => {
    expect(d03Profiles["EML-E0-D03-L02"].systemModel).toContain(
      "reversible operation"
    );
    expect(d03Profiles["EML-E0-D03-L02"].failurePattern).toContain(
      "dividing by a quantity that may be zero"
    );

    expect(d03Profiles["EML-E0-D03-L03"].systemModel).toContain(
      "average rate"
    );
    expect(d03Profiles["EML-E0-D03-L03"].systemModel).toContain(
      "instantaneous derivative"
    );
    expect(
      d03Profiles["EML-E0-D03-L03"].reasonedCases[0]?.verification
    ).toContain("not a prerequisite");

    expect(d03Profiles["EML-E0-D03-L04"].applicationTask).toContain(
      "5.00 m displacement"
    );
    expect(d03Profiles["EML-E0-D03-L04"].applicationTask).toContain(
      "horizontal and vertical metre components"
    );

    expect(d03Profiles["EML-E0-D03-L05"].failurePattern).toContain(
      "body frame"
    );
    expect(d03Profiles["EML-E0-D03-L05"].failurePattern).toContain(
      "world frame"
    );

    expect(d03Profiles["EML-E0-D03-L06"].systemModel).toContain(
      "active counter-clockwise planar rotation"
    );
    expect(d03Profiles["EML-E0-D03-L06"].applicationTask).toContain(
      "without introducing translation"
    );

    expect(d03Profiles["EML-E0-D03-L07"].systemModel).toContain(
      "same physical unit"
    );
    expect(d03Profiles["EML-E0-D03-L07"].systemModel).toContain(
      "non-negative square root"
    );
    expect(
      d03Profiles["EML-E0-D03-L07"].conditions.find(
        (condition) => condition.conditionId === "scope-condition"
      )?.statement
    ).toContain("phasors and impedance require additional definitions");

    Object.values(d03Profiles).forEach((profile) => {
      expect(profile.explorer.controls).toHaveLength(2);
      (["q2", "q3", "q4", "q5"] as const).forEach((question) => {
        expect(profile.assessments[question].base.hints).toHaveLength(2);
        expect(profile.assessments[question].retry.hints).toHaveLength(2);
        expect(profile.assessments[question].base.solution).toHaveLength(2);
        expect(profile.assessments[question].retry.solution).toHaveLength(2);
      });
    });
  });
});
