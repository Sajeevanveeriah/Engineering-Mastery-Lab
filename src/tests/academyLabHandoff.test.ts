import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AcademyHandoffContextPanel } from "../components/academy/AcademyHandoffBanner";
import { AcademyLessonBlockView } from "../components/academy/AcademyLessonBlock";
import { academySkills } from "../data/academy/catalogue";
import {
  buildAcademyHandoffRoute,
  parseAcademyHandoffContext,
  validateAcademyHandoffLesson
} from "../lib/academy/handoff";
import { loadAcademyLesson } from "../lib/academy/curriculum";
import { planAcademyMasteryEvidence } from "../lib/academy/masteryIntegration";
import {
  emptyProgress,
  formatAcademyAppliedEvidenceSummary,
  normaliseAcademyAppliedEvidenceReceipt,
  recordAcademyLabEvidence,
  startAcademyLabHandoff
} from "../lib/storage";

const timestamp = "2026-07-30T09:30:00.000Z";
const courseId = "ACADEMY-E0";
const unitId = "EML-E0-D01";
const lessonId = "EML-E0-D01-L01";
const blockId = `${lessonId}-BLOCK-LAB`;
const destinationRoute = "/learn/labs/practice";
const academyReturn =
  `/learn/courses/${courseId}/units/${unitId}/lessons/${lessonId}?resume=${blockId}`;
const task =
  "Run the bounded practice activity and retain the observable result.";
const expectedOutcome =
  "A retained input, result and criterion comparison for independent review.";

function handoffRoute(): string {
  return buildAcademyHandoffRoute({
    destinationRoute,
    academyReturn,
    lessonId,
    blockId,
    task,
    expectedOutcome
  });
}

describe("Academy laboratory handoff", () => {
  it("builds and parses a canonical internal return context", () => {
    const route = handoffRoute();
    const separator = route.indexOf("?");
    const parsed = parseAcademyHandoffContext(
      route.slice(separator),
      route.slice(0, separator)
    );

    expect(parsed).toEqual({
      status: "valid",
      context: {
        academyReturn,
        courseId,
        unitId,
        lessonId,
        blockId,
        task,
        expectedOutcome,
        destinationRoute,
        labId: blockId
      }
    });
  });

  it("fails closed for external, incomplete, duplicated or mismatched context", () => {
    const valid = new URL(handoffRoute(), "https://local.invalid");

    const external = new URLSearchParams(valid.search);
    external.set("academyReturn", "https://example.com/steal");
    expect(parseAcademyHandoffContext(`?${external}`, destinationRoute)).toMatchObject({
      status: "invalid"
    });

    const incomplete = new URLSearchParams(valid.search);
    incomplete.delete("expected");
    expect(parseAcademyHandoffContext(`?${incomplete}`, destinationRoute)).toMatchObject({
      status: "invalid"
    });

    const duplicate = new URLSearchParams(valid.search);
    duplicate.append("lesson", lessonId);
    expect(parseAcademyHandoffContext(`?${duplicate}`, destinationRoute)).toMatchObject({
      status: "invalid"
    });

    const mismatch = new URLSearchParams(valid.search);
    mismatch.set("block", `${lessonId}-BLOCK-OTHER`);
    expect(parseAcademyHandoffContext(`?${mismatch}`, destinationRoute)).toMatchObject({
      status: "invalid"
    });

    expect(parseAcademyHandoffContext(valid.search, "https://example.com")).toMatchObject({
      status: "invalid"
    });
  });

  it("checks the query values against the authored lesson and destination", async () => {
    const lesson = await loadAcademyLesson(lessonId);
    expect(lesson).not.toBeNull();
    if (!lesson) return;
    const authoredBlock = lesson.blocks.find((block) => block.id === blockId);
    expect(authoredBlock?.kind).toBe("laboratory-callout");
    if (!authoredBlock || authoredBlock.kind !== "laboratory-callout") return;

    const authoredRoute = buildAcademyHandoffRoute({
      destinationRoute: authoredBlock.route,
      academyReturn,
      lessonId,
      blockId,
      task: authoredBlock.task,
      expectedOutcome: authoredBlock.expectedOutcome
    });
    const separator = authoredRoute.indexOf("?");
    const parsed = parseAcademyHandoffContext(
      authoredRoute.slice(separator),
      authoredRoute.slice(0, separator)
    );
    expect(parsed.status).toBe("valid");
    if (parsed.status !== "valid") return;
    expect(validateAcademyHandoffLesson(parsed.context, lesson)).toBe(parsed.context);
    expect(() => validateAcademyHandoffLesson({
      ...parsed.context,
      task: `${parsed.context.task} altered`
    }, lesson)).toThrow(/authored laboratory task/);
    expect(() => validateAcademyHandoffLesson({
      ...parsed.context,
      expectedOutcome: `${parsed.context.expectedOutcome} altered`
    }, lesson)).toThrow(/authored laboratory task/);
    expect(() => validateAcademyHandoffLesson({
      ...parsed.context,
      destinationRoute: "/learn/labs/pid"
    }, lesson)).toThrow(/authored laboratory task/);
  });

  it("records unfinished work on open without awarding lesson or skill mastery", () => {
    const started = startAcademyLabHandoff(structuredClone(emptyProgress), {
      courseId,
      unitId,
      lessonId,
      labId: blockId,
      blockId,
      timestamp
    });

    expect(started.academy.unfinishedLabs[blockId]).toMatchObject({
      labId: blockId,
      courseId,
      unitId,
      lessonId,
      status: "in-progress",
      lastStepId: blockId,
      notes: ""
    });
    expect(
      started.academy.lessonRecords[lessonId]?.requirements.appliedEvidenceSatisfied
    ).toBe(false);
    expect(started.academy.lessonRecords[lessonId]?.completionEarned).toBe(false);
    expect(started.academy.skillRecords).toEqual({});
  });

  it("requires meaningful evidence, records it, then clears only the matching unfinished handoff", () => {
    const started = startAcademyLabHandoff(structuredClone(emptyProgress), {
      courseId,
      unitId,
      lessonId,
      labId: blockId,
      blockId,
      timestamp
    });
    const evidence = {
      observedResult: "Input A produced a stable measured output of 4.2 V.",
      criterionComparison: "The result was within 0.1 V of the expected 4.3 V outcome.",
      evidenceReference: "TEST-LAB-042"
    };
    const evidenceSummary = formatAcademyAppliedEvidenceSummary(evidence);
    const skill = academySkills.find((candidate) => candidate.lessonIds.includes(lessonId));
    expect(skill).toBeDefined();
    if (!skill) return;
    const plan = planAcademyMasteryEvidence(
      started.academy,
      skill,
      {
        evidenceId: "EV-LAB-HANDOFF-001",
        kind: "applied-evidence",
        referenceId: blockId,
        summary: evidenceSummary,
        recordedAt: timestamp,
        passed: true
      },
      timestamp
    );
    expect(evidenceSummary).toContain(
      "Evidence status: learner-attested local record; not independently verified."
    );
    expect(plan.reason).toContain("Learner-attested local applied evidence");
    expect(plan.reason).toContain("not independently verified proof");

    expect(() => normaliseAcademyAppliedEvidenceReceipt({})).toThrow(
      /missing required field/
    );
    expect(() => normaliseAcademyAppliedEvidenceReceipt({
      observedResult: evidence.observedResult
    })).toThrow(/missing required field/);
    expect(() => normaliseAcademyAppliedEvidenceReceipt({
      criterionComparison: evidence.criterionComparison
    })).toThrow(/missing required field/);
    expect(() => normaliseAcademyAppliedEvidenceReceipt({
      evidenceReference: evidence.evidenceReference
    })).toThrow(/missing required field/);
    expect(() => normaliseAcademyAppliedEvidenceReceipt({
      ...evidence,
      evidenceReference: "done"
    })).toThrow(/must identify a saved record/);
    expect(() => normaliseAcademyAppliedEvidenceReceipt({
      ...evidence,
      observedResult: "The test passed successfully."
    })).toThrow(/specific learner-observed value/);
    expect(() => normaliseAcademyAppliedEvidenceReceipt({
      ...evidence,
      criterionComparison: "Everything worked as expected."
    })).toThrow(/specific learner-observed value/);
    expect(() => recordAcademyLabEvidence(started, {
      courseId,
      unitId,
      lessonId,
      labId: blockId,
      blockId,
      evidence: {
        ...evidence,
        observedResult: "done"
      },
      skillEvidencePlans: [plan],
      timestamp
    })).toThrow(/Observed result must contain at least 12 characters and three words/);
    expect(() => recordAcademyLabEvidence(started, {
      courseId,
      unitId,
      lessonId,
      labId: blockId,
      blockId,
      evidence,
      skillEvidencePlans: [{
        ...plan,
        evidence: {
          ...plan.evidence,
          summary: `${evidenceSummary}\nMismatched context`
        }
      }],
      timestamp
    })).toThrow(/matching passed applied evidence/);
    expect(started.academy.unfinishedLabs[blockId]).toBeDefined();

    const completed = recordAcademyLabEvidence(started, {
      courseId,
      unitId,
      lessonId,
      labId: blockId,
      blockId,
      evidence,
      skillEvidencePlans: [plan],
      timestamp
    });

    expect(completed.academy.unfinishedLabs[blockId]).toBeUndefined();
    expect(
      completed.academy.lessonRecords[lessonId]?.requirements.appliedEvidenceSatisfied
    ).toBe(true);
    expect(completed.academy.skillRecords[skill.id]).toMatchObject({
      mastery: "introduced",
      evidence: [{
        kind: "applied-evidence",
        referenceId: blockId,
        summary: evidenceSummary,
        passed: true
      }]
    });
  });

  it("renders the lesson callout and destination panel without a self-award control", async () => {
    const lesson = await loadAcademyLesson(lessonId);
    expect(lesson).not.toBeNull();
    if (!lesson) return;
    const block = lesson.blocks.find((candidate) => candidate.id === blockId);
    expect(block?.kind).toBe("laboratory-callout");
    if (!block || block.kind !== "laboratory-callout") return;

    const calloutHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(AcademyLessonBlockView, {
          lesson,
          block,
          sources: new Map(),
          initialScores: {},
          attemptHistory: {},
          onQuestionAttempt: () => undefined,
          onKnowledgePassed: () => undefined,
          onPracticePassed: () => undefined,
          academyReturn,
          appliedEvidenceSatisfied: false,
          onLaboratoryOpen: () => undefined
        })
      )
    );
    expect(calloutHtml).toContain("Open the laboratory");
    expect(calloutHtml).toContain("Learner-attested evidence still required");
    expect(calloutHtml).toContain("awards nothing");
    expect(calloutHtml).toContain("does not independently verify");
    expect(calloutHtml).toContain("academyReturn=");
    expect(calloutHtml).not.toContain("Record applied task completed");

    const route = buildAcademyHandoffRoute({
      destinationRoute: block.route,
      academyReturn,
      lessonId,
      blockId,
      task: block.task,
      expectedOutcome: block.expectedOutcome
    });
    const separator = route.indexOf("?");
    const parsed = parseAcademyHandoffContext(
      route.slice(separator),
      route.slice(0, separator)
    );
    expect(parsed.status).toBe("valid");
    if (parsed.status !== "valid") return;
    const unfinished = startAcademyLabHandoff(structuredClone(emptyProgress), {
      courseId,
      unitId,
      lessonId,
      labId: blockId,
      blockId,
      timestamp
    }).academy.unfinishedLabs[blockId];
    const panelHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(AcademyHandoffContextPanel, {
          context: parsed.context,
          unfinished,
          completed: false,
          evidence: {
            observedResult: "",
            criterionComparison: "",
            evidenceReference: ""
          },
          actionError: "",
          actionMessage: "",
          submitting: false,
          onEvidenceChange: () => undefined,
          onSubmit: () => undefined
        })
      )
    );
    expect(panelHtml).toContain("Carry the lesson task into this workspace");
    expect(panelHtml).toContain("Return to lesson");
    expect(panelHtml).toContain("Opening or visiting this workspace records no completion or mastery");
    expect(panelHtml).toContain("learner-attested local evidence");
    expect(panelHtml).toContain("does not authenticate");
    expect(panelHtml).toContain("independently verify");
    expect(panelHtml).toContain(parsed.context.lessonId);
    expect(panelHtml).toContain(parsed.context.blockId);
    expect(panelHtml).toContain(parsed.context.destinationRoute);
    expect(panelHtml).toContain(parsed.context.task);
    expect(panelHtml).toContain(parsed.context.expectedOutcome);
    expect(panelHtml).toContain("Observed or tool result");
    expect(panelHtml).toContain("Acceptance-criterion comparison");
    expect(panelHtml).toContain("Evidence reference or trace");
  });
});
