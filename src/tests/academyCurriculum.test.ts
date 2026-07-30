import { readFileSync } from "node:fs";
import type {
  AcademyInstruction,
  AcademyStageContent
} from "../lib/academy/types";
import { commandCatalogue } from "../data/catalogue";
import { flagshipCatalogue } from "../data/engineeringExperiences";
import { modules } from "../data/modules";
import { pathways } from "../data/pathways";
import { projects } from "../data/projects";
import { rebootSessions } from "../data/rebootCurriculum";
import { academyUnitSourceMap } from "../data/academy/catalogue";
import {
  academyLessonTeachingProfiles,
  type AcademyLessonTeachingProfile,
  validateAcademyLessonTeachingProfiles
} from "../data/academy/lessonTeachingProfiles";
import { academyLessonTeachingProfilesE0 } from "../data/academy/lessonTeachingProfiles/E0";
import { academyLessonTeachingProfilesE1 } from "../data/academy/lessonTeachingProfiles/E1";
import { academyLessonTeachingProfilesE2 } from "../data/academy/lessonTeachingProfiles/E2";
import { academyLessonTeachingProfilesE3 } from "../data/academy/lessonTeachingProfiles/E3";
import { academyLessonTeachingProfilesE4 } from "../data/academy/lessonTeachingProfiles/E4";
import {
  academyAssessmentsManifest,
  academyCatalogue,
  academyCourseCatalogue,
  academyMandatoryCoverageRequirements,
  academyMediaManifest,
  academyMediaPlacementManifest,
  academyRouteManifest,
  academyRebootSessionPlan,
  academySessionMappings,
  academySkillsManifest,
  academySourcesManifest,
  academyUnitCatalogue,
  buildAcademyFormulaManifest,
  buildAcademySkillAssessmentManifest,
  getAcademyLessonStage,
  loadAcademyCourse,
  loadAcademyLesson,
  loadAllAcademyStages,
  validateAcademyCatalogue,
  validateAcademyCurriculum,
  validateAcademyMediaPlacements,
  validateAcademyRouteResolution
} from "../lib/academy/curriculum";
import {
  assertDistinctQuestionRetryAnswers,
  generateAcademyQuestionRetry,
  generateQuestionVariant,
  getQuestionExpectedResponseFingerprint,
  getQuestionRetryLimit,
  getQuestionVariantExpectedValue
} from "../lib/academy/assessment";

const instructionIsReviewed = (instruction: AcademyInstruction): boolean =>
  instruction.length > 0
  && instruction.every((part) => part.kind === "text"
    ? part.text.trim().length > 0
    : (
        part.expression.id.trim().length > 0
        && part.expression.plainText.trim().length > 0
        && part.expression.latex.trim().length > 0
        && part.expression.spoken.trim().length > 0
      ));

const academyLessonTeachingProfilePartitions = {
  E0: academyLessonTeachingProfilesE0,
  E1: academyLessonTeachingProfilesE1,
  E2: academyLessonTeachingProfilesE2,
  E3: academyLessonTeachingProfilesE3,
  E4: academyLessonTeachingProfilesE4
} as const;

describe("Academy curriculum architecture", () => {
  let stages: AcademyStageContent[];
  let lessons: AcademyStageContent["lessons"];

  beforeAll(async () => {
    stages = await loadAllAcademyStages();
    lessons = stages.flatMap((stage) => stage.lessons);
  });

  it("keeps the eager catalogue lesson-free and loads five stage chunks", () => {
    expect("lessons" in academyCatalogue).toBe(false);
    expect(stages.map((stage) => stage.stage)).toEqual(["E0", "E1", "E2", "E3", "E4"]);
    expect(stages.map((stage) => stage.lessons.length)).toEqual([21, 35, 56, 49, 14]);
  });

  it("retains the complete E0-E4 hierarchy and all 25 legacy modules", () => {
    expect(academyCourseCatalogue).toHaveLength(5);
    expect(academyUnitCatalogue).toHaveLength(25);
    expect(academyUnitCatalogue.map((unit) => unit.legacyModuleId)).toEqual(
      academyUnitCatalogue.map((unit) => unit.id)
    );
    expect(academyCourseCatalogue.map((course) => course.unitIds.length)).toEqual([3, 5, 8, 7, 2]);
    for (const course of academyCourseCatalogue) {
      expect(course.unitIds.every((unitId) => academyUnitCatalogue.some((unit) => unit.id === unitId))).toBe(true);
      const unitLessonMinutes = lessons
        .filter((lesson) => course.unitIds.includes(lesson.unitId))
        .reduce((total, lesson) => total + lesson.estimatedMinutes, 0);
      expect(course.estimatedMinutes).toBe(unitLessonMinutes + course.unitIds.length * 55);
    }
  });

  it("provides exactly seven substantive lessons per unit and 175 stable lesson IDs", () => {
    expect(lessons).toHaveLength(175);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(175);
    for (const unit of academyUnitCatalogue) {
      expect(unit.lessonIds).toHaveLength(7);
      expect(unit.lessonIds).toEqual(
        Array.from({ length: 7 }, (_, index) => `${unit.id}-L${String(index + 1).padStart(2, "0")}`)
      );
      expect(lessons.filter((lesson) => lesson.unitId === unit.id)).toHaveLength(7);
    }
  });

  it("resolves prerequisite chains and reciprocal previous and next navigation", () => {
    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    const orderedIds = academyUnitCatalogue.flatMap((unit) => unit.lessonIds);
    for (let index = 0; index < orderedIds.length; index += 1) {
      const lesson = lessonById.get(orderedIds[index]);
      expect(lesson).toBeDefined();
      expect(lesson?.prerequisites.every((id) => lessonById.has(id))).toBe(true);
      expect(lesson?.previousLessonId).toBe(index === 0 ? null : orderedIds[index - 1]);
      expect(lesson?.nextLessonId).toBe(index === orderedIds.length - 1 ? null : orderedIds[index + 1]);
    }
  });

  it("meets the native lesson, visual, practice, feedback and solution contract", () => {
    const requiredKinds = [
      "prose",
      "definition",
      "interactive-visual",
      "misconception",
      "knowledge-check",
      "practice-set",
      "laboratory-callout",
      "summary",
      "source-note"
    ];
    for (const lesson of lessons) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(2);
      expect(lesson.objectives.length).toBeLessThanOrEqual(5);
      expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(30);
      expect(lesson.estimatedMinutes).toBeLessThanOrEqual(60);
      expect(lesson.summary.length).toBeGreaterThanOrEqual(3);
      expect(lesson.retrievalPrompts.length).toBeGreaterThanOrEqual(3);
      expect(lesson.laboratoryRoute?.startsWith("/")).toBe(true);
      expect(lesson.questions.length).toBeGreaterThanOrEqual(4);
      expect(lesson.questions.length).toBeLessThanOrEqual(7);
      for (const kind of requiredKinds) {
        expect(lesson.blocks.some((block) => block.kind === kind), `${lesson.id} lacks ${kind}`).toBe(true);
      }
      const nativeWordCount = lesson.blocks
        .filter((block) => block.kind === "prose")
        .flatMap((block) => block.paragraphs)
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length;
      expect(nativeWordCount, `${lesson.id} native prose depth`).toBeGreaterThanOrEqual(120);
      for (const question of lesson.questions) {
        expect(question.feedbackCorrect.trim()).not.toBe("");
        expect(question.feedbackIncorrect.trim()).not.toBe("");
        expect(Object.keys(question.misconceptionFeedback).length).toBeGreaterThan(0);
        expect(question.hints.length).toBeGreaterThanOrEqual(2);
        expect(question.solution.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("integrates 175 direct teaching profiles without identity-only boilerplate", () => {
    const canonicalLessonIds = academyUnitCatalogue.flatMap((unit) => unit.lessonIds);
    expect(Object.keys(academyLessonTeachingProfiles).sort()).toEqual(
      [...canonicalLessonIds].sort()
    );
    expect(
      validateAcademyLessonTeachingProfiles(
        canonicalLessonIds,
        academyLessonTeachingProfiles
      )
    ).toEqual([]);

    const duplicateProfiles = structuredClone(academyLessonTeachingProfiles) as Record<
      string,
      AcademyLessonTeachingProfile
    >;
    duplicateProfiles[canonicalLessonIds[1]] = {
      ...duplicateProfiles[canonicalLessonIds[0]]
    };
    expect(
      validateAcademyLessonTeachingProfiles(canonicalLessonIds, duplicateProfiles)
        .some((entry) => entry.startsWith("duplicate-"))
    ).toBe(true);

    const normaliseRendered = (
      value: string,
      lesson: AcademyStageContent["lessons"][number]
    ): string => {
      let normalised = value.normalize("NFKC").toLocaleLowerCase("en-AU");
      const identityValues = [
        lesson.summary[0],
        lesson.title,
        lesson.id,
        lesson.unitId,
        lesson.laboratoryRoute ?? ""
      ]
        .map((entry) => entry.normalize("NFKC").toLocaleLowerCase("en-AU"))
        .filter(Boolean)
        .sort((left, right) => right.length - left.length);
      for (const identityValue of identityValues) {
        normalised = normalised.split(identityValue).join(" ");
      }
      return normalised
        .replace(/(?:eml|academy)[\s/_-]*[a-z0-9/_-]+/gu, " ")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .replace(/\s+/g, " ");
    };

    const signatures = {
      system: new Map<string, string>(),
      visual: new Map<string, string>(),
      application: new Map<string, string>(),
      failure: new Map<string, string>()
    };
    const authoredDefinitions = new Set<string>();

    for (const lesson of lessons) {
      const profile = academyLessonTeachingProfiles[lesson.id];
      const intro = lesson.blocks.find(
        (block) => block.kind === "prose"
        && block.heading === "Start from the physical or computational question"
      );
      const definition = lesson.blocks.find((block) => block.kind === "definition");
      const example = lesson.blocks.find(
        (block) => block.kind === "prose"
        && block.heading === "Subject-specific example and disconfirming case"
      );
      const visual = lesson.blocks.find((block) => block.kind === "interactive-visual");
      const laboratory = lesson.blocks.find((block) => block.kind === "laboratory-callout");
      const misconception = lesson.blocks.find((block) => block.kind === "misconception");
      expect(profile, lesson.id).toBeDefined();
      expect(intro?.kind).toBe("prose");
      expect(definition?.kind).toBe("definition");
      expect(example?.kind).toBe("prose");
      expect(visual?.kind).toBe("interactive-visual");
      expect(laboratory?.kind).toBe("laboratory-callout");
      expect(misconception?.kind).toBe("misconception");
      if (
        !profile
        || intro?.kind !== "prose"
        || definition?.kind !== "definition"
        || example?.kind !== "prose"
        || visual?.kind !== "interactive-visual"
        || laboratory?.kind !== "laboratory-callout"
        || misconception?.kind !== "misconception"
      ) {
        throw new Error(`Missing direct lesson-specific teaching content for ${lesson.id}`);
      }

      expect(lesson.objectives.join(" ")).toContain(profile.systemModel);
      expect(lesson.objectives.join(" ")).toContain(profile.applicationTask);
      expect(lesson.objectives.join(" ")).toContain(profile.failurePattern);
      expect(intro.paragraphs.join(" ")).toContain(profile.systemModel);
      expect(definition.definition).toBe(lesson.summary[0]);
      expect(misconception.claim).toContain(profile.failurePattern);
      expect(lesson.summary.join(" ")).toContain(profile.visualExplanation);
      expect(lesson.summary.join(" ")).toContain(profile.applicationTask);
      expect(lesson.retrievalPrompts.join(" ")).toContain(profile.systemModel);
      expect(lesson.retrievalPrompts.join(" ")).toContain(profile.visualExplanation);
      expect(lesson.retrievalPrompts.join(" ")).toContain(profile.failurePattern);
      expect(example.paragraphs.join(" ")).toContain(profile.applicationTask);
      expect(example.paragraphs.join(" ")).toContain(profile.visualExplanation);
      expect(example.paragraphs.join(" ")).toContain(profile.failurePattern);
      expect(JSON.stringify(lesson.questions)).toContain(profile.systemModel);

      authoredDefinitions.add(definition.definition);
      signatures.system.set(lesson.id, normaliseRendered(intro.paragraphs[0], lesson));
      signatures.visual.set(lesson.id, normaliseRendered(visual.textEquivalent, lesson));
      signatures.application.set(lesson.id, normaliseRendered(laboratory.task, lesson));
      signatures.failure.set(lesson.id, normaliseRendered(misconception.claim, lesson));
    }

    expect(authoredDefinitions.size).toBe(175);
    for (const [dimension, valuesByLessonId] of Object.entries(signatures)) {
      expect(
        new Set(valuesByLessonId.values()).size,
        `${dimension} normalised uniqueness`
      ).toBe(175);
      for (const unit of academyUnitCatalogue) {
        const unitTokenSets = unit.lessonIds.map(
          (lessonId) => new Set((valuesByLessonId.get(lessonId) ?? "").split(" ").filter(Boolean))
        );
        const commonTokens = new Set(
          [...unitTokenSets[0]].filter((token) =>
            unitTokenSets.slice(1).every((tokenSet) => tokenSet.has(token))
          )
        );
        for (let index = 0; index < unit.lessonIds.length; index += 1) {
          const residualTokenCount = [...unitTokenSets[index]]
            .filter((token) => !commonTokens.has(token))
            .length;
          expect(
            residualTokenCount,
            `${dimension} ${unit.lessonIds[index]} residual subject tokens`
          ).toBeGreaterThanOrEqual(4);
        }
      }
    }
  });

  it("partitions teaching profiles into stage-only runtime payloads", () => {
    const expectedCounts = { E0: 21, E1: 35, E2: 56, E3: 49, E4: 14 };
    const partitionIds = Object.entries(academyLessonTeachingProfilePartitions)
      .flatMap(([stage, profiles]) => {
        const lessonIds = Object.keys(profiles);
        expect(lessonIds).toHaveLength(expectedCounts[stage as keyof typeof expectedCounts]);
        expect(lessonIds.every((lessonId) => lessonId.startsWith(`EML-${stage}-`))).toBe(true);
        expect(validateAcademyLessonTeachingProfiles(lessonIds, profiles)).toEqual([]);
        return lessonIds;
      });

    expect(partitionIds).toHaveLength(175);
    expect(new Set(partitionIds).size).toBe(175);
    expect({
      ...academyLessonTeachingProfilesE0,
      ...academyLessonTeachingProfilesE1,
      ...academyLessonTeachingProfilesE2,
      ...academyLessonTeachingProfilesE3,
      ...academyLessonTeachingProfilesE4
    }).toEqual(academyLessonTeachingProfiles);
  });

  it("authors static code-analysis questions without changing the six-question lesson contract", () => {
    const codeQuestions = lessons.flatMap((lesson) => lesson.questions
      .filter((question) => question.type === "code-analysis")
      .map((question) => ({ lessonId: lesson.id, question })));
    expect(codeQuestions).toHaveLength(7);
    expect(new Set(codeQuestions.map(({ question }) => question.language))).toEqual(
      new Set(["python3", "cpp17", "c11"])
    );
    const independentlyTracedAnswers = new Map<string, string>([
      ["EML-E1-D07-L01", "4.0"],
      ["EML-E1-D07-L02", "6"],
      ["EML-E1-D07-L05", "10"],
      ["EML-E1-D07-L06", "RUN"],
      ["EML-E2-D13-L02", "0x6"],
      ["EML-E2-D13-L03", "0"],
      ["EML-E2-D13-L06", "1"]
    ]);
    for (const { lessonId, question } of codeQuestions) {
      expect(question.code.trim()).not.toBe("");
      expect(question.options).toHaveLength(3);
      expect(question.options.some((option) => option.id === question.correctOptionId)).toBe(true);
      expect(question.code).not.toMatch(/\b(?:eval|exec|system|spawn|subprocess)\s*\(/i);
      const correctOption = question.options.find((option) => option.id === question.correctOptionId);
      expect(correctOption?.label, `${lessonId} answer trace`).toBe(independentlyTracedAnswers.get(lessonId));
    }
    expect(new Set(codeQuestions.map(({ lessonId }) => lessonId))).toEqual(
      new Set(independentlyTracedAnswers.keys())
    );
    expect(lessons.every((lesson) => lesson.questions.length === 6)).toBe(true);
  });

  it("authors every supported question type, including bounded lesson-specific matching", () => {
    const questions = lessons.flatMap((lesson) => lesson.questions);
    const expectedTypes = [
      "code-analysis",
      "diagram",
      "matching",
      "multiple-selection",
      "numeric",
      "ordering",
      "seeded-calculation",
      "short-response",
      "single-choice"
    ];
    expect(questions).toHaveLength(1050);
    expect([...new Set(questions.map((question) => question.type))].sort()).toEqual(expectedTypes);
    const typeCounts = questions.reduce<Record<string, number>>((counts, question) => {
      counts[question.type] = (counts[question.type] ?? 0) + 1;
      return counts;
    }, {});
    expect(typeCounts).toEqual({
      "single-choice": 175,
      ordering: 175,
      "multiple-selection": 237,
      "short-response": 170,
      matching: 5,
      diagram: 168,
      "code-analysis": 7,
      numeric: 110,
      "seeded-calculation": 3
    });
    const matching = questions.filter((question) => question.type === "matching");
    expect(matching).toHaveLength(5);
    for (const question of matching) {
      expect(question.left).toHaveLength(3);
      expect(question.right).toHaveLength(3);
      expect(Object.keys(question.correctPairs)).toHaveLength(3);
      expect(question.left.every((item) =>
        question.right.some((candidate) => candidate.id === question.correctPairs[item.id])
      )).toBe(true);
    }
    expect(questions.filter((question) => question.type === "code-analysis")).toHaveLength(7);
    expect(lessons.every((lesson) => lesson.questions.length === 6)).toBe(true);
  });

  it("preserves technical names and uses grammatical diagnostic question prompts", () => {
    const questionPrompt = (lessonId: string, questionId: string) =>
      lessons
        .find((lesson) => lesson.id === lessonId)
        ?.questions.find((question) => question.id === questionId)
        ?.prompt;

    expect(
      questionPrompt("EML-E0-D02-L03", "EML-E0-D02-L03-Q02")
    ).toContain('workflow for "SI base quantities and derived units"');
    expect(
      questionPrompt("EML-E1-D07-L01", "EML-E1-D07-L01-Q01")
    ).toContain("Python");
    expect(
      questionPrompt("EML-E2-D15-L01", "EML-E2-D15-L01-Q03")
    ).toContain(
      'Which records make an application of "Signals, systems and physical information" reviewable?'
    );
    expect(
      questionPrompt("EML-E1-D07-L01", "EML-E1-D07-L01-Q04")
    ).toContain(
      'applying "Programming concepts from zero with Python" changes'
    );
  });

  it("uses one verified local rover image and rejects unsafe Academy image contracts", () => {
    const imageBlocks = lessons.flatMap((lesson) =>
      lesson.blocks.filter((block) => block.kind === "image")
    );
    expect(imageBlocks).toHaveLength(1);
    const image = imageBlocks[0];
    expect(image.src).toBe("./assets/20260730-Engineering-Mastery-Lab-Hero-Rover-Rev00.webp");
    expect(image.alt.trim()).not.toBe("");
    expect(image.caption.trim()).not.toBe("");

    const roverAsset = readFileSync(
      new URL("../../public/assets/20260730-Engineering-Mastery-Lab-Hero-Rover-Rev00.webp", import.meta.url)
    );
    expect(roverAsset.toString("ascii", 12, 16)).toBe("VP8X");
    expect(image.width).toBe(roverAsset.readUIntLE(24, 3) + 1);
    expect(image.height).toBe(roverAsset.readUIntLE(27, 3) + 1);

    const invalidStages = structuredClone(stages);
    invalidStages[0].lessons[0].blocks.push({
      id: "INVALID-REMOTE-IMAGE",
      kind: "image",
      src: "https://example.com/untrusted.png",
      alt: "",
      caption: "",
      width: 0,
      height: -1
    });
    expect(validateAcademyCurriculum(invalidStages)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "lesson-image",
          path: "lessons.EML-E0-D01-L01.blocks.INVALID-REMOTE-IMAGE"
        })
      ])
    );
  });

  it("provides derivations and at least two independently checked examples for quantitative lessons", () => {
    const quantitative = lessons.filter((lesson) => lesson.formulae.length > 0);
    expect(quantitative.length).toBeGreaterThan(100);
    for (const lesson of quantitative) {
      expect(lesson.blocks.some((block) => block.kind === "derivation")).toBe(true);
      const examples = lesson.blocks.filter((block) => block.kind === "worked-example");
      expect(examples.length).toBeGreaterThanOrEqual(2);
      for (const example of examples) {
        expect(example.example.assumptions.length).toBeGreaterThan(0);
        expect(example.example.steps.length).toBeGreaterThanOrEqual(3);
        expect(instructionIsReviewed(example.example.problem)).toBe(true);
        expect(example.example.steps.every(instructionIsReviewed)).toBe(true);
        expect(instructionIsReviewed(example.example.result)).toBe(true);
        expect(instructionIsReviewed(example.example.dimensionalCheck)).toBe(true);
        expect(instructionIsReviewed(example.example.independentCheck)).toBe(true);
      }
    }
  });

  it("keeps governing equations aligned with the exact lesson subject", () => {
    const formulaFor = (lessonId: string) =>
      lessons.find((lesson) => lesson.id === lessonId)?.formulae[0]?.latex;
    expect(formulaFor("EML-E0-D02-L04")).toBe("\\sigma=\\frac{F}{A}");
    expect(formulaFor("EML-E2-D11-L03")).toBe("f_c=\\frac{1}{2\\pi RC}");
    expect(formulaFor("EML-E2-D15-L05")).toBe("X_k=\\sum_{n=0}^{N-1}x_n e^{-j2\\pi kn/N}");
    expect(formulaFor("EML-E3-D18-L04")).toBe("I=mr^2");
    expect(formulaFor("EML-E3-D23-L02")).toBe("\\theta_{next}=\\theta-\\alpha\\frac{\\partial J}{\\partial\\theta}");
    expect(formulaFor("EML-E2-D11-L04"))
      .toBe("I_D=I_S\\left(e^{V_D/(nV_T)}-1\\right)");
    expect(formulaFor("EML-E3-D19-L05"))
      .toContain("\\hat{x}^{+}");
    expect(formulaFor("EML-E3-D19-L06"))
      .toContain("\\frac{\\partial h}{\\partial x}");
    expect(formulaFor("EML-E3-D23-L07")).toBeUndefined();
  });

  it("keeps the repaired E0 application tasks inside their declared mathematical boundaries", () => {
    expect(academyLessonTeachingProfilesE0["EML-E0-D03-L04"].applicationTask).toBe(
      "Resolve a displacement in metres into horizontal and vertical components using a declared angle, reconstruct the original displacement magnitude and state the angle convention used."
    );
    expect(academyLessonTeachingProfilesE0["EML-E0-D03-L06"].applicationTask).toBe(
      "Apply one explicitly active counter-clockwise planar rotation to a point between frames that share an origin, calculate the transformed coordinates and verify that its distance from the origin is unchanged."
    );
    expect(academyLessonTeachingProfilesE0["EML-E0-D03-L07"].applicationTask).toBe(
      "Represent one engineering quantity as z = a + jb with same-unit rectangular components, calculate its non-negative magnitude and verify the result from the squared components."
    );
  });

  it("independently recomputes the repaired semiconductor and state-estimation answers", () => {
    const numericQuestionFor = (lessonId: string) => {
      const question = lessons
        .find((lesson) => lesson.id === lessonId)
        ?.questions.find((candidate) => candidate.id === `${lessonId}-Q06`);
      expect(question?.type, lessonId).toBe("numeric");
      if (question?.type !== "numeric") {
        throw new Error(`Expected a numeric governing assessment for ${lessonId}`);
      }
      return question;
    };

    const diode = numericQuestionFor("EML-E2-D11-L04");
    const diodeCurrentMilliamps =
      1e-9 * (Math.exp(0.50 / (2 * 0.025)) - 1) * 1000;
    expect(diode.expectedValue).toBeCloseTo(diodeCurrentMilliamps, 7);

    const kalman = numericQuestionFor("EML-E3-D19-L05");
    const gain = 4 / (4 + 1);
    expect(kalman.expectedValue).toBeCloseTo(5 + gain * (8 - 5), 12);

    const extendedKalman = numericQuestionFor("EML-E3-D19-L06");
    const observationJacobian = 2 * 2;
    const innovationCovariance =
      observationJacobian ** 2 * 0.25 + 1;
    const extendedGain =
      0.25 * observationJacobian / innovationCovariance;
    expect(extendedKalman.expectedValue)
      .toBeCloseTo(2 + extendedGain * (5 - 2 ** 2), 12);
  });

  it("authors deterministic seeded calculation practice with changed retry values", () => {
    const seeded = lessons.flatMap((lesson) =>
      lesson.questions
        .filter((question) => question.type === "seeded-calculation")
        .map((question) => ({ lessonId: lesson.id, question }))
    );
    expect(seeded.map(({ lessonId }) => lessonId)).toEqual([
      "EML-E0-D02-L07",
      "EML-E2-D12-L02",
      "EML-E2-D12-L03"
    ]);
    for (const { question } of seeded) {
      const first = generateQuestionVariant(question, 0);
      const repeat = generateQuestionVariant(question, 0);
      const retry = generateQuestionVariant(question, 1);
      expect(question.prompt).toContain("{{input}}");
      expect(question.mathSupport).toBeDefined();
      expect(question.mathSupport?.hints).toHaveLength(question.hints.length);
      expect(question.mathSupport?.solution).toHaveLength(question.solution.length);
      expect(repeat).toEqual(first);
      expect(retry.inputValue).not.toBe(first.inputValue);
      expect(getQuestionVariantExpectedValue(question, 0)).not.toBe(
        getQuestionVariantExpectedValue(question, 1)
      );
    }
  });

  it("authors bounded same-lesson retries with unique expected responses", () => {
    const ignoredSubjectWords = new Set([
      "about",
      "after",
      "before",
      "between",
      "could",
      "decision",
      "engineering",
      "evidence",
      "lesson",
      "model",
      "result",
      "system",
      "their",
      "through",
      "using",
      "which",
      "with"
    ]);
    for (const lesson of lessons) {
      const profile = academyLessonTeachingProfiles[lesson.id];
      const subjectTokens = [
        lesson.title,
        profile.systemModel,
        profile.applicationTask,
        profile.failurePattern,
        profile.visualExplanation
      ]
        .join(" ")
        .toLocaleLowerCase("en-AU")
        .match(/[a-z0-9]+/g)
        ?.filter((token) => token.length >= 5 && !ignoredSubjectWords.has(token))
        ?? [];
      expect(subjectTokens.length, `${lesson.id} subject tokens`).toBeGreaterThan(0);

      for (const question of lesson.questions) {
        const retryLimit = getQuestionRetryLimit(question);
        expect(retryLimit, `${question.id} retry count`).toBeGreaterThanOrEqual(1);
        expect(() => assertDistinctQuestionRetryAnswers(question)).not.toThrow();

        const fingerprints = Array.from(
          { length: retryLimit + 1 },
          (_, retryIndex) =>
            getQuestionExpectedResponseFingerprint(question, retryIndex)
        );
        expect(
          new Set(fingerprints).size,
          `${question.id} expected response fingerprints`
        ).toBe(fingerprints.length);

        for (let retryIndex = 1; retryIndex <= retryLimit; retryIndex += 1) {
          const retry = generateAcademyQuestionRetry(
            question,
            retryIndex
          ).question;
          expect(retry.id, `${question.id} retry identity`).toBe(question.id);
          expect(
            [...retry.skillIds].sort(),
            `${question.id} retry skills`
          ).toEqual([...question.skillIds].sort());
          const retrySubjectText = JSON.stringify({
            ...retry,
            id: "",
            skillIds: []
          }).toLocaleLowerCase("en-AU");
          expect(
            subjectTokens.some((token) => retrySubjectText.includes(token)),
            `${question.id} retry subject context`
          ).toBe(true);
        }
      }
    }
  });

  it("authors per-control explorer outcomes, actions and evidence from every lesson profile", () => {
    const explorerSignatures = new Set<string>();
    for (const lesson of lessons) {
      const profile = academyLessonTeachingProfiles[lesson.id];
      const visual = lesson.blocks.find(
        (block) => block.kind === "interactive-visual"
      );
      expect(profile, lesson.id).toBeDefined();
      expect(visual?.kind, lesson.id).toBe("interactive-visual");
      if (!profile || visual?.kind !== "interactive-visual") {
        throw new Error(`Missing authored concept explorer for ${lesson.id}`);
      }

      expect(visual.controls, lesson.id).toHaveLength(3);
      expect(
        new Set(visual.controls.map((control) => control.id)).size,
        `${lesson.id} explorer control IDs`
      ).toBe(visual.controls.length);
      expect(
        new Set(visual.controls.map((control) => control.label)).size,
        `${lesson.id} explorer control labels`
      ).toBe(visual.controls.length);

      const profileTokens = new Set(
        [
          profile.systemModel,
          profile.visualExplanation,
          profile.applicationTask,
          profile.failurePattern
        ]
          .join(" ")
          .toLocaleLowerCase("en-AU")
          .match(/[a-z0-9]{5,}/gu) ?? []
      );
      for (const control of visual.controls) {
        const rendered = [
          control.outcome,
          control.requiredAction,
          control.retainedEvidence
        ].join(" ");
        expect(control.outcome.trim(), `${control.id} outcome`).not.toBe("");
        expect(control.requiredAction, `${control.id} action`).toContain(
          profile.applicationTask
        );
        expect(control.retainedEvidence.trim(), `${control.id} evidence`).not.toBe("");
        const subjectTokenCount = new Set(
          (rendered.toLocaleLowerCase("en-AU").match(/[a-z0-9]{5,}/gu) ?? [])
            .filter((token) => profileTokens.has(token))
        ).size;
        expect(
          subjectTokenCount,
          `${control.id} retained subject tokens`
        ).toBeGreaterThanOrEqual(4);
      }

      const renderedControls = JSON.stringify(visual.controls);
      expect(renderedControls).toContain(profile.systemModel);
      expect(renderedControls).toContain(profile.visualExplanation);
      expect(renderedControls).toContain(profile.applicationTask);
      expect(renderedControls).toContain(profile.failurePattern);
      explorerSignatures.add(
        JSON.stringify(
          visual.controls.map(({ id: _id, ...control }) => control)
        )
      );
    }
    expect(explorerSignatures.size).toBe(175);
  });

  it("authors valid answer-linked relationship graphs for every base and retry diagram", () => {
    const graphSignatures = new Set<string>();
    const directions = new Set<string>();
    const layouts = new Set<string>();
    let diagramCount = 0;

    for (const lesson of lessons) {
      const profile = academyLessonTeachingProfiles[lesson.id];
      const base = lesson.questions.find(
        (question) => question.type === "diagram"
      );
      if (!base || base.type !== "diagram") continue;
      const retry = generateAcademyQuestionRetry(base, 1).question;
      expect(retry.type, `${lesson.id} diagram retry type`).toBe("diagram");
      if (retry.type !== "diagram") {
        throw new Error(`Expected a diagram retry for ${lesson.id}`);
      }
      diagramCount += 1;

      for (const [mode, question] of [
        ["base", base],
        ["retry", retry]
      ] as const) {
        const { diagram } = question;
        expect(diagram.nodes.length, `${lesson.id} ${mode} node count`)
          .toBeGreaterThanOrEqual(3);
        expect(diagram.nodes.length, `${lesson.id} ${mode} node count`)
          .toBeLessThanOrEqual(5);
        expect(
          new Set(diagram.nodes.map((node) => node.id)).size,
          `${lesson.id} ${mode} unique node IDs`
        ).toBe(diagram.nodes.length);
        expect(
          new Set(diagram.edges.map((edge) => edge.id)).size,
          `${lesson.id} ${mode} unique edge IDs`
        ).toBe(diagram.edges.length);

        const nodeIds = new Set(diagram.nodes.map((node) => node.id));
        const connectedNodeIds = new Set<string>();
        for (const edge of diagram.edges) {
          expect(
            nodeIds.has(edge.fromNodeId),
            `${lesson.id} ${mode} edge ${edge.id} from endpoint`
          ).toBe(true);
          expect(
            nodeIds.has(edge.toNodeId),
            `${lesson.id} ${mode} edge ${edge.id} to endpoint`
          ).toBe(true);
          expect(edge.fromNodeId, `${lesson.id} ${mode} edge ${edge.id}`)
            .not.toBe(edge.toNodeId);
          expect(edge.label.trim(), `${lesson.id} ${mode} edge ${edge.id} label`)
            .not.toBe("");
          connectedNodeIds.add(edge.fromNodeId);
          connectedNodeIds.add(edge.toNodeId);
          directions.add(edge.direction);
        }
        expect(
          connectedNodeIds,
          `${lesson.id} ${mode} connected nodes`
        ).toEqual(nodeIds);

        const answerEdge = diagram.edges.find(
          (edge) => edge.id === diagram.answerEdgeId
        );
        expect(answerEdge, `${lesson.id} ${mode} answer edge`).toBeDefined();
        if (!answerEdge) {
          throw new Error(`Missing answer edge for ${lesson.id} ${mode}`);
        }
        const from = diagram.nodes.find(
          (node) => node.id === answerEdge.fromNodeId
        );
        const to = diagram.nodes.find(
          (node) => node.id === answerEdge.toNodeId
        );
        if (!from || !to) {
          throw new Error(`Unresolved answer relationship for ${lesson.id} ${mode}`);
        }
        const connector = answerEdge.direction === "directed" ? "->" : "<->";
        const expectedAnswer =
          `${from.label} ${connector} ${answerEdge.label} ${connector} ${to.label}.`;
        expect(
          question.options.find(
            (option) => option.id === question.correctOptionId
          )?.label,
          `${lesson.id} ${mode} answer depends on represented edge`
        ).toBe(expectedAnswer);

        const roleById = new Map(
          diagram.nodes.map((node) => [node.id, node.role])
        );
        graphSignatures.add(JSON.stringify({
          layout: diagram.layout,
          nodes: diagram.nodes.map(({ label, detail, role }) => ({
            label,
            detail,
            role
          })),
          edges: diagram.edges.map((edge) => ({
            from: roleById.get(edge.fromNodeId),
            to: roleById.get(edge.toNodeId),
            label: edge.label,
            direction: edge.direction
          }))
        }));
        layouts.add(diagram.layout);
      }

      const combinedGraphText = JSON.stringify([base.diagram, retry.diagram]);
      expect(combinedGraphText).toContain(profile.systemModel);
      expect(combinedGraphText).toContain(profile.visualExplanation);
      expect(combinedGraphText).toContain(profile.applicationTask);
      expect(combinedGraphText).toContain(profile.failurePattern);
      expect(base.diagramDescription).toContain(profile.visualExplanation);
      expect(retry.diagramDescription).toContain(profile.failurePattern);
    }

    expect(diagramCount).toBe(168);
    expect(graphSignatures.size).toBe(168 * 2);
    expect(layouts).toEqual(new Set(["chain", "branch", "convergence"]));
    expect(directions).toEqual(new Set(["directed", "undirected"]));
  });

  it("keeps every base and retry diagram distractor unique and lesson-specific", () => {
    const allDistractors: string[] = [];
    for (const lesson of lessons) {
      const profile = academyLessonTeachingProfiles[lesson.id];
      const diagram = lesson.questions.find(
        (question) => question.type === "diagram"
      );
      if (!diagram || diagram.type !== "diagram") continue;
      const baseDistractors = diagram.options.filter(
        (option) => option.id !== diagram.correctOptionId
      );
      expect(baseDistractors, `${lesson.id} base distractors`).toHaveLength(2);
      expect(baseDistractors[0].label).toContain(profile.applicationTask);
      expect(baseDistractors[1].label).toContain(profile.failurePattern);

      const retry = generateAcademyQuestionRetry(diagram, 1).question;
      expect(retry.type, `${lesson.id} diagram retry type`).toBe("diagram");
      if (retry.type !== "diagram") {
        throw new Error(`Expected a diagram retry for ${lesson.id}`);
      }
      const retryDistractors = retry.options.filter(
        (option) => option.id !== retry.correctOptionId
      );
      expect(retryDistractors, `${lesson.id} retry distractors`).toHaveLength(2);
      expect(retryDistractors[0].label).toContain(profile.applicationTask);
      expect(retryDistractors[0].label).toContain(profile.failurePattern);
      expect(retryDistractors[1].label).toContain(profile.visualExplanation);

      const localLabels = [
        ...diagram.options.map((option) => option.label),
        ...retry.options.map((option) => option.label)
      ];
      expect(
        new Set(localLabels).size,
        `${lesson.id} base and retry diagram labels`
      ).toBe(localLabels.length);
      expect(localLabels.join(" ")).not.toMatch(
        /(?:tool|page) opened|hidden assumptions|proof awarded/i
      );
      allDistractors.push(
        ...baseDistractors.map((option) => option.label),
        ...retryDistractors.map((option) => option.label)
      );
    }
    expect(allDistractors).toHaveLength(168 * 4);
    expect(new Set(allDistractors).size).toBe(allDistractors.length);
  });

  it("keeps quantitative prompt, hint and solution prose free of raw equation markup", () => {
    const rawEquationMarkup = /(?:=|\\(?:frac|sum|int|sqrt|begin)|\^[{(0-9A-Za-z])/u;
    const quantitativeQuestions = lessons.flatMap((lesson) =>
      lesson.questions.filter(
        (question) =>
          question.type === "numeric"
          || question.type === "seeded-calculation"
      )
    );
    expect(quantitativeQuestions.length).toBeGreaterThan(100);
    for (const question of quantitativeQuestions) {
      expect(question.mathSupport, question.id).toBeDefined();
      expect(
        [question.prompt, ...question.hints, ...question.solution].join("\n"),
        question.id
      ).not.toMatch(rawEquationMarkup);
    }
  });

  it("keeps qualitative lessons substantive without formula filler", () => {
    const qualitative = lessons.filter((lesson) => lesson.formulae.length === 0);
    expect(qualitative.length).toBeGreaterThan(0);
    for (const lesson of qualitative) {
      expect(lesson.questions).toHaveLength(6);
      expect(lesson.blocks.some((block) => block.kind === "interactive-visual")).toBe(true);
      expect(lesson.blocks.some((block) => block.kind === "laboratory-callout")).toBe(true);
      expect(lesson.blocks.filter((block) => block.kind === "prose").length).toBeGreaterThanOrEqual(2);
      const assessmentQuestion = lesson.questions.find((question) => question.id.endsWith("-Q06"));
      expect(assessmentQuestion?.type, lesson.id).toBe("multiple-selection");
      if (assessmentQuestion?.type !== "multiple-selection") {
        throw new Error(`Qualitative assessment ${lesson.id}-Q06 is not multiple-selection`);
      }
      expect(assessmentQuestion.correctOptionIds).toEqual([
        `${lesson.id}-Q06-FAILURE`,
        `${lesson.id}-Q06-CHECK`
      ]);
      const profile = academyLessonTeachingProfiles[lesson.id];
      expect(profile, lesson.id).toBeDefined();
      expect(assessmentQuestion.options.find((option) => option.id.endsWith("-FAILURE"))?.label)
        .toContain(profile?.failurePattern);
      expect(assessmentQuestion.options.find((option) => option.id.endsWith("-CHECK"))?.label)
        .toContain(profile?.applicationTask);
    }
  });

  it("builds each formal unit test from both an applied analysis and a governing assessment", () => {
    for (const unit of academyUnitCatalogue) {
      expect(unit.unitTest.questionIds).toHaveLength(14);
      for (const lessonId of unit.lessonIds) {
        expect(unit.unitTest.questionIds).toContain(`${lessonId}-Q05`);
        expect(unit.unitTest.questionIds).toContain(`${lessonId}-Q06`);
      }
    }
  });

  it("maps every exact mandatory coverage subject to teaching, assessment and application", () => {
    expect(academyMandatoryCoverageRequirements).toHaveLength(241);
    expect(academyCatalogue.coverage).toHaveLength(academyMandatoryCoverageRequirements.length);
    const lessonsById = new Set(lessons.map((lesson) => lesson.id));
    const assessmentsById = new Set(academyAssessmentsManifest.map((assessment) => assessment.id));
    for (const entry of academyCatalogue.coverage) {
      expect(entry.status).toBe("mapped");
      expect(lessonsById.has(entry.lessonId), entry.requirementId).toBe(true);
      expect(entry.assessmentIds.length).toBeGreaterThanOrEqual(2);
      expect(entry.assessmentIds.every((id) => assessmentsById.has(id))).toBe(true);
      expect(entry.appliedRoute?.startsWith("/")).toBe(true);
    }

    const unresolvedCatalogue = structuredClone(academyCatalogue);
    unresolvedCatalogue.coverage[0].lessonId = "EML-MISSING-LESSON";
    expect(validateAcademyCatalogue(unresolvedCatalogue)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "coverage-references",
          path: `coverage.${unresolvedCatalogue.coverage[0].requirementId}`
        })
      ])
    );
  });

  it("maps ordered S001-S110 sessions, proof gates, reviews, assessments and internal routes", () => {
    expect(academySessionMappings).toHaveLength(110);
    const proofIds = academySessionMappings.filter((mapping) => mapping.mandatoryProof).map((mapping) => mapping.sessionId);
    expect(proofIds).toEqual(["S006", "S016", "S028", "S040", "S052", "S066", "S078", "S090", "S100", "S110"]);
    for (let index = 0; index < academySessionMappings.length; index += 1) {
      const mapping = academySessionMappings[index];
      expect(mapping.sessionId).toBe(`S${String(index + 1).padStart(3, "0")}`);
      expect(mapping.lessonIds.length).toBeGreaterThan(0);
      expect(mapping.assessmentIds.length).toBeGreaterThan(0);
      expect(mapping.reviewSkillIds.length).toBeGreaterThan(0);
      expect(mapping.appliedRoutes.length).toBeGreaterThan(0);
      expect(mapping.appliedRoutes.every((route) => route.startsWith("/"))).toBe(true);
    }
  });

  it("matches every authoritative S001-S110 topic without modulo-generated substitutions", () => {
    expect(
      academyRebootSessionPlan.map(({ sessionId, topic }) => ({ sessionId, topic }))
    ).toEqual(
      rebootSessions.map(({ id, topic }) => ({ sessionId: id, topic }))
    );
    expect(new Set(academyRebootSessionPlan.map((entry) => entry.sessionId)).size).toBe(110);
  });

  it("keeps P1-P4, eight labs, five flagships, pathways and existing tools reachable", () => {
    const mappedRoutes = new Set(academySessionMappings.flatMap((mapping) => mapping.appliedRoutes));
    for (const manifestEntry of academyRouteManifest) {
      expect(mappedRoutes.has(manifestEntry.route), manifestEntry.id).toBe(true);
    }
    expect(academyRouteManifest.filter((entry) => entry.category === "release")).toHaveLength(4);
    expect(academyRouteManifest.filter((entry) => entry.category === "laboratory")).toHaveLength(8);
    expect(academyRouteManifest.filter((entry) => entry.category === "flagship")).toHaveLength(5);
    expect(academyRouteManifest.filter((entry) => entry.category === "pathway")).toHaveLength(10);
    expect(academyRouteManifest.filter((entry) => entry.category === "tool").length).toBeGreaterThanOrEqual(8);
  });

  it("resolves every Academy route through the live project, pathway, laboratory, flagship and tool registries", () => {
    const liveRoutes = new Set<string>([
      ...modules.map((module) => `/learn/labs/${module.id}`),
      ...projects.map((project) => `/projects/${project.slug}`),
      ...pathways.map((pathway) => `/learn/pathways/${pathway.id}`),
      ...flagshipCatalogue.map((flagship) => flagship.route),
      ...commandCatalogue.map((item) => item.route),
      ...["P1", "P2", "P3", "P4"].map((releaseId) => `/projects/releases/${releaseId}`)
    ]);
    expect(validateAcademyRouteResolution(liveRoutes)).toEqual([]);

    for (const unit of academyUnitCatalogue) {
      if (unit.laboratoryRoute) expect(liveRoutes.has(unit.laboratoryRoute), unit.id).toBe(true);
      if (unit.projectRoute) expect(liveRoutes.has(unit.projectRoute), unit.id).toBe(true);
    }

    const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
    expect(appSource).toContain('path="/learn/pathways/:pathwayId"');
    expect(appSource).toContain('path="/learn/flagships/:flagshipId"');
    expect(appSource).toContain('path={`/learn/labs/${id}`}');
    expect(appSource).toContain('path="/projects/:projectId"');
    expect(appSource).toContain('path="/projects/releases/:releaseId"');
    expect(appSource).toContain('path="/portfolio/capstone"');
    for (const tool of academyRouteManifest.filter((entry) => entry.category === "tool")) {
      expect(appSource, tool.route).toContain(`path="${tool.route}"`);
    }
  });

  it("resolves every assessment question and every source and media reference", () => {
    const questionIds = new Set(lessons.flatMap((lesson) => lesson.questions.map((question) => question.id)));
    const sourceIds = new Set(academySourcesManifest.map((source) => source.id));
    const mediaIds = new Set(academyMediaManifest.map((media) => media.id));
    for (const assessment of academyAssessmentsManifest) {
      expect(assessment.questionIds.length).toBeGreaterThan(0);
      expect(assessment.questionIds.every((id) => questionIds.has(id)), assessment.id).toBe(true);
    }
    for (const lesson of lessons) {
      expect(lesson.sourceIds.every((id) => sourceIds.has(id)), lesson.id).toBe(true);
      expect(lesson.mediaIds.every((id) => mediaIds.has(id)), lesson.id).toBe(true);
      expect(lesson.sourceIds).toEqual([...academyUnitSourceMap[lesson.unitId]]);
    }
    expect(academySkillsManifest).toHaveLength(25);
  });

  it("publishes and verifies the complete media-to-lesson placement manifest", () => {
    expect(academyMediaPlacementManifest.map((entry) => entry.mediaId).sort()).toEqual(
      academyMediaManifest.map((media) => media.id).sort()
    );
    for (const entry of academyMediaPlacementManifest) {
      expect(entry.lessonIds.length, entry.mediaId).toBeGreaterThan(0);
      expect(entry.lessonIds).toEqual(
        lessons
          .filter((lesson) => lesson.mediaIds.includes(entry.mediaId))
          .map((lesson) => lesson.id)
          .sort()
      );
    }
    expect(validateAcademyMediaPlacements(stages)).toEqual([]);

    const invalidPlacements = structuredClone(academyMediaPlacementManifest);
    invalidPlacements[0].lessonIds = ["EML-MISSING-LESSON"];
    expect(validateAcademyMediaPlacements(stages, invalidPlacements)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "media-placement",
          path: `mediaPlacements.${invalidPlacements[0].mediaId}`
        })
      ])
    );
  });

  it("uses reviewed subject-family sources for CAD, materials, manufacturing, communications and professional practice", () => {
    const requiredSourceFamilies: Record<string, readonly string[]> = {
      "EML-E1-D08": ["SRC-AUTODESK-FUSION-CAD-90", "SRC-DOE-DRAWINGS", "SRC-ASME-Y14-5"],
      "EML-E2-D09": ["SRC-MIT-2-001", "SRC-MIT-2-72"],
      "EML-E2-D10": ["SRC-MIT-2-008", "SRC-NIST-ADDITIVE-MANUFACTURING"],
      "EML-E2-D14": [
        "SRC-PLCOPEN-IEC-61131-3",
        "SRC-ARM-CMSIS-DRIVER",
        "SRC-MODBUS-SPECIFICATIONS",
        "SRC-OASIS-MQTT-5",
        "SRC-OPC-UA-PART-1",
        "SRC-RFC-9293",
        "SRC-OMG-DDS-1-4"
      ],
      "EML-E4-D25": ["SRC-ENGINEERS-AUSTRALIA-STAGE-1", "SRC-ENGINEERS-AUSTRALIA-ETHICS"]
    };
    for (const [unitId, sourceIds] of Object.entries(requiredSourceFamilies)) {
      expect(academyUnitSourceMap[unitId], unitId).toEqual(expect.arrayContaining([...sourceIds]));
    }
  });

  it("builds complete mathematics and skill-assessment manifests", () => {
    const formulaManifest = buildAcademyFormulaManifest(stages);
    expect(formulaManifest.length).toBe(lessons.filter((lesson) => lesson.formulae.length > 0).length);
    expect(formulaManifest.every((entry) =>
      entry.structuralStatus === "pass"
      && entry.renderVerificationId.length > 0
      && entry.variableSymbols.length > 0
      && entry.workedExampleCount >= 2
      && entry.derivationStepCount >= 2
    )).toBe(true);

    const invalidFormulaStages = structuredClone(stages);
    const invalidFormulaLesson = invalidFormulaStages
      .flatMap((stage) => stage.lessons)
      .find((lesson) => lesson.formulae.length > 0);
    if (!invalidFormulaLesson) throw new Error("Expected at least one quantitative lesson");
    invalidFormulaLesson.formulae[0].variables = [];
    expect(buildAcademyFormulaManifest(invalidFormulaStages)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          formulaId: invalidFormulaLesson.formulae[0].id,
          structuralStatus: "fail"
        })
      ])
    );
    expect(validateAcademyCurriculum(invalidFormulaStages)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "formula-manifest",
          path: "formulaManifest"
        })
      ])
    );

    const skillManifest = buildAcademySkillAssessmentManifest(stages);
    expect(skillManifest).toHaveLength(25);
    expect(skillManifest.every((entry) =>
      entry.practiceQuestionIds.length > 0
      && entry.quizIds.length > 0
      && entry.unitTestIds.length > 0
      && entry.courseChallengeIds.length > 0
      && entry.appliedRoutes.length > 0
    )).toBe(true);
  });

  it("contains no placeholder, outbound-only instruction or prohibited Unicode dash", () => {
    const content = JSON.stringify({
      catalogue: academyCatalogue,
      lessons
    });
    expect(content).not.toMatch(/\b(?:TODO|TBD|placeholder|lorem ipsum|coming soon)\b/i);
    expect(content).not.toMatch(/\b(?:read the documentation|external reading|visit the website)\b/i);
    expect(content).not.toMatch(/[\u2013\u2014]/u);
  });

  it("loads courses and lessons through the public lazy resolver", async () => {
    expect(getAcademyLessonStage("EML-E3-D18-L04")).toBe("E3");
    expect(getAcademyLessonStage("missing-lesson")).toBeNull();
    const lesson = await loadAcademyLesson("EML-E3-D18-L04");
    expect(lesson?.title).toBe("URDF, Xacro and robot models");
    const course = await loadAcademyCourse("ACADEMY-E3");
    expect(course?.units).toHaveLength(7);
    expect(course?.lessons).toHaveLength(49);
    expect(await loadAcademyCourse("missing-course")).toBeNull();
  });

  it("passes pure catalogue and aggregate validators with no unresolved references", () => {
    expect(validateAcademyCatalogue()).toEqual([]);
    expect(validateAcademyCurriculum(stages)).toEqual([]);
  });
});
