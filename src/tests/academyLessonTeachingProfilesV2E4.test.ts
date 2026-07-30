import { describe, expect, it } from "vitest";
import { academyUnitSeeds } from "../data/academy/catalogue";
import d24Profiles, {
  academyLessonTeachingProfileV2LessonIdsE4D24,
  academyLessonTeachingProfileV2TitlesE4D24
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E4-D24";
import d25Profiles, {
  academyLessonTeachingProfileV2LessonIdsE4D25,
  academyLessonTeachingProfileV2TitlesE4D25
} from "../data/academy/lessonTeachingProfilesV2/units/EML-E4-D25";
import {
  normaliseAcademyAssessmentV2Shell,
  validateAcademyLessonTeachingProfileV2,
  validateAcademyLessonTeachingProfileV2Registry
} from "../data/academy/lessonTeachingProfileV2Validation";
import {
  loadAcademyLessonTeachingProfileV2UnitForLesson
} from "../lib/academy/lessonTeachingProfileV2Loader";

const expectedD24Ids = [
  "EML-E4-D24-L01",
  "EML-E4-D24-L02",
  "EML-E4-D24-L03",
  "EML-E4-D24-L04",
  "EML-E4-D24-L05",
  "EML-E4-D24-L06",
  "EML-E4-D24-L07"
] as const;

const expectedD24Titles = [
  "Stakeholder needs and measurable requirements",
  "Functional decomposition and system architectures",
  "Interfaces and evidence-led trade studies",
  "Risk management, FMEA and hazard analysis",
  "Safety engineering and reliability",
  "Verification, validation and experimental design",
  "Configuration, change control and technical readiness"
] as const;

const expectedD25Ids = [
  "EML-E4-D25-L01",
  "EML-E4-D25-L02",
  "EML-E4-D25-L03",
  "EML-E4-D25-L04",
  "EML-E4-D25-L05",
  "EML-E4-D25-L06",
  "EML-E4-D25-L07"
] as const;

const expectedD25Titles = [
  "Project planning and decision records",
  "Technical reports and reproducible evidence",
  "Design reviews and engineering argument",
  "Ethics, sustainability and professional responsibility",
  "Portfolio evidence and claim boundaries",
  "Capstone integration and release",
  "Interview demonstrations and professional proof"
] as const;

const catalogueTitlesFor = (unitId: string): readonly string[] => {
  const unit = academyUnitSeeds.find((candidate) => candidate.id === unitId);
  if (unit === undefined) {
    throw new Error(`Missing academy catalogue unit ${unitId}.`);
  }
  return unit.lessonTitles;
};

const expectUniqueAssessmentShells = (profiles: typeof d24Profiles) => {
  (["q2", "q3", "q4"] as const).forEach((question) => {
    const shells = Object.values(profiles).map((profile) =>
      normaliseAcademyAssessmentV2Shell(profile, question)
    );
    expect(new Set(shells).size).toBe(Object.keys(profiles).length);
  });
};

describe("Academy E4 lesson teaching profiles V2", () => {
  it("materialises the seven exact D24 catalogue lessons", () => {
    expect(academyLessonTeachingProfileV2LessonIdsE4D24).toEqual(
      expectedD24Ids
    );
    expect(Object.keys(d24Profiles)).toEqual(expectedD24Ids);
    expect(academyLessonTeachingProfileV2TitlesE4D24).toEqual(
      expectedD24Titles
    );
    expect(catalogueTitlesFor("EML-E4-D24")).toEqual(expectedD24Titles);
  });

  it("materialises the seven exact D25 catalogue lessons", () => {
    expect(academyLessonTeachingProfileV2LessonIdsE4D25).toEqual(
      expectedD25Ids
    );
    expect(Object.keys(d25Profiles)).toEqual(expectedD25Ids);
    expect(academyLessonTeachingProfileV2TitlesE4D25).toEqual(
      expectedD25Titles
    );
    expect(catalogueTitlesFor("EML-E4-D25")).toEqual(expectedD25Titles);
  });

  it("lazy-loads each E4 unit and resumes the exact requested lesson", async () => {
    const requests = [
      ["EML-E4-D24-L04", "EML-E4-D24"],
      ["EML-E4-D25-L07", "EML-E4-D25"]
    ] as const;

    for (const [lessonId, unitId] of requests) {
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

  it("validates both units and all 14 profiles as one registry", () => {
    const registry = {
      ...d24Profiles,
      ...d25Profiles
    };

    expect(Object.keys(registry)).toEqual([
      ...expectedD24Ids,
      ...expectedD25Ids
    ]);
    expect(validateAcademyLessonTeachingProfileV2Registry(registry)).toEqual(
      []
    );
    Object.values(registry).forEach((profile) => {
      expect(validateAcademyLessonTeachingProfileV2(profile)).toEqual([]);
      expect(profile.explorer.controls).toHaveLength(2);
      (["q2", "q3", "q4", "q5"] as const).forEach((question) => {
        expect(profile.assessments[question].base.hints).toHaveLength(2);
        expect(profile.assessments[question].retry.hints).toHaveLength(2);
        expect(profile.assessments[question].base.solution).toHaveLength(2);
        expect(profile.assessments[question].retry.solution).toHaveLength(2);
      });
    });
  });

  it("keeps every sibling assessment shell structurally distinct", () => {
    expectUniqueAssessmentShells(d24Profiles);
    expectUniqueAssessmentShells(d25Profiles);
  });

  it("preserves the core D24 and D25 professional boundaries", () => {
    expect(d24Profiles["EML-E4-D24-L01"].systemModel).toContain(
      "measurable and verifiable obligation"
    );
    expect(d24Profiles["EML-E4-D24-L03"].failurePattern).toContain(
      "hard interface violation"
    );
    expect(d24Profiles["EML-E4-D24-L04"].failurePattern).toContain(
      "catastrophic low-frequency harm"
    );
    expect(d24Profiles["EML-E4-D24-L05"].systemModel).toContain(
      "reliability models the probability"
    );
    expect(d24Profiles["EML-E4-D24-L06"].systemModel).toContain(
      "Verification compares implementation with requirements"
    );
    expect(d24Profiles["EML-E4-D24-L06"].systemModel).toContain(
      "validation compares the resulting system with intended use"
    );
    expect(d24Profiles["EML-E4-D24-L07"].failurePattern).toContain(
      "reviewed configuration differs from the built system"
    );

    expect(d25Profiles["EML-E4-D25-L01"].systemModel).toContain(
      "bounded work packages through dependencies"
    );
    expect(d25Profiles["EML-E4-D25-L02"].systemModel).toContain(
      "reproduce the evidence"
    );
    expect(d25Profiles["EML-E4-D25-L03"].systemModel).toContain(
      "engineering argument"
    );
    expect(d25Profiles["EML-E4-D25-L04"].systemModel).toContain(
      "duty to people"
    );
    expect(d25Profiles["EML-E4-D25-L05"].systemModel).toContain(
      "personal contribution"
    );
    expect(d25Profiles["EML-E4-D25-L06"].failurePattern).toContain(
      "fails at the integrated boundary"
    );
    expect(d25Profiles["EML-E4-D25-L07"].systemModel).toContain(
      "clear separation of fact, assumption and future work"
    );
  });
});
