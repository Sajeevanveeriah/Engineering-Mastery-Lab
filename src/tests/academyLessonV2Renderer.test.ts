// Focused contract tests for the full V2 learner renderer.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AcademyLessonV2,
  academyLessonV2SectionId,
  buildAcademyLessonV2Outline
} from "../components/academy/AcademyLessonV2";
import {
  AcademyLessonV2DomainGraph,
  AcademyLessonV2Explorer
} from "../components/academy/AcademyLessonV2Explorer";
import type {
  AcademyExplorerState,
  AcademyLessonTeachingProfileV2
} from "../data/academy/lessonTeachingProfileV2";
import {
  academyLessonV2AssessmentId,
  academyLessonV2MatchingRightId,
  academyLessonV2QuestionId,
  gradeAcademyLessonV2Matching,
  gradeAcademyLessonV2Ordering,
  gradeAcademyLessonV2Q5,
  gradeAcademyLessonV2Selection,
  gradeAcademyLessonV2ShortResponse,
  type AcademyLessonV2QuestionIdentity,
  type AcademyLessonV2QuestionKey,
  type AcademyLessonV2ScenarioMode
} from "../lib/academy/lessonTeachingProfileV2Assessment";

const feedback = {
  feedbackCorrect: "The reasoning follows the declared model and criterion.",
  feedbackIncorrect: "Recheck the mechanism, boundary and decision criterion.",
  hints: [
    "Name the entities before deciding what changes.",
    "Apply the stated relation and then test the boundary."
  ],
  solution: [
    "Trace the measurement into the estimate.",
    "Compare the estimate with the criterion before accepting the command."
  ]
};

const profile: AcademyLessonTeachingProfileV2 = {
  schemaVersion: 2,
  lessonId: "EML-E1-D01-L01",
  systemModel:
    "A mobile robot turns a sensor measurement into a state estimate, compares the estimate with a boundary and only then accepts a motion command.",
  failurePattern:
    "A delayed measurement can make the estimate look precise while it no longer represents the robot's current state.",
  visualExplanation:
    "A directed graph follows measurement, estimate, boundary check and command, while a changed-delay control shows the failure path.",
  applicationTask:
    "Decide whether a motion command is supported by the estimate and retain the checked criterion.",
  terms: [
    {
      termId: "term-estimate",
      label: "State estimate",
      definition:
        "A calculated description of the robot state built from available measurements.",
      boundary:
        "It is not a direct observation and is only credible under the declared timing and noise conditions.",
      firstUseStepId: "concept-measure"
    },
    {
      termId: "term-latency",
      label: "Sensor delay",
      definition:
        "The elapsed time between the physical event and the measurement becoming available.",
      boundary:
        "It excludes later planning and actuator delays unless the lesson explicitly combines them.",
      firstUseStepId: "concept-estimate"
    },
    {
      termId: "term-criterion",
      label: "Acceptance criterion",
      definition:
        "A stated test that decides whether the evidence supports using the command.",
      boundary:
        "It is not a confidence feeling or an attractive visual result.",
      firstUseStepId: "concept-compare"
    }
  ],
  entities: [
    {
      entityId: "entity-sensor",
      entityType: "input",
      label: "Sensor measurement",
      definition: "A time-stamped observation supplied to the estimator."
    },
    {
      entityId: "entity-estimate",
      entityType: "state",
      label: "State estimate",
      definition: "The current calculated robot state."
    },
    {
      entityId: "entity-threshold",
      entityType: "criterion",
      label: "Error threshold",
      definition: "The largest accepted position error."
    },
    {
      entityId: "entity-command",
      entityType: "decision",
      label: "Motion command",
      definition: "The command accepted only after the criterion is met."
    }
  ],
  relations: [
    {
      relationId: "relation-update",
      relationKind: "transforms",
      fromEntityIds: ["entity-sensor"],
      toEntityIds: ["entity-estimate"],
      predicate: "measurement updates estimate",
      direction: "directed",
      cardinality: "many-to-one"
    },
    {
      relationId: "relation-compare",
      relationKind: "compares",
      fromEntityIds: ["entity-estimate"],
      toEntityIds: ["entity-threshold"],
      predicate: "estimate is compared with threshold",
      direction: "directed",
      cardinality: "one-to-one"
    },
    {
      relationId: "relation-support",
      relationKind: "supports",
      fromEntityIds: ["entity-estimate", "entity-threshold"],
      toEntityIds: ["entity-command"],
      predicate: "validated estimate supports command",
      direction: "directed",
      cardinality: "many-to-one"
    }
  ],
  conditions: [
    {
      conditionId: "condition-delay",
      conditionType: "operating-state",
      statement: "Sensor delay stays below 50 ms.",
      affectedEntityIds: ["entity-sensor", "entity-estimate"],
      affectedRelationIds: ["relation-update"]
    },
    {
      conditionId: "condition-boundary",
      conditionType: "boundary",
      statement: "Position error remains below 0.10 m.",
      affectedEntityIds: ["entity-estimate", "entity-threshold"],
      affectedRelationIds: ["relation-compare"]
    },
    {
      conditionId: "condition-criterion",
      conditionType: "criterion",
      statement:
        "Accept the command only when position error remains below 0.10 m.",
      affectedEntityIds: ["entity-threshold", "entity-command"],
      affectedRelationIds: ["relation-support"]
    }
  ],
  failureBoundary: {
    failureId: "failure-stale-estimate",
    conditionId: "condition-delay",
    mechanism:
      "The delayed measurement updates the estimator after the robot has already moved.",
    observableConsequence:
      "The displayed position differs from an independent current-position check.",
    criterion:
      "Reject the command when measured delay is 50 ms or greater.",
    affectedEntityIds: ["entity-sensor", "entity-estimate", "entity-command"],
    affectedRelationIds: ["relation-update", "relation-support"]
  },
  conceptualModel: [
    {
      stepId: "concept-measure",
      statement:
        "First, attach a trustworthy time to the sensor measurement.",
      entityIds: ["entity-sensor"],
      relationIds: [],
      conditionIds: ["condition-delay"]
    },
    {
      stepId: "concept-estimate",
      statement:
        "Next, use the measurement to update the state estimate.",
      entityIds: ["entity-sensor", "entity-estimate"],
      relationIds: ["relation-update"],
      conditionIds: ["condition-delay"]
    },
    {
      stepId: "concept-compare",
      statement:
        "Then compare the state estimate with the explicit error threshold.",
      entityIds: ["entity-estimate", "entity-threshold"],
      relationIds: ["relation-compare"],
      conditionIds: ["condition-boundary"]
    },
    {
      stepId: "concept-decide",
      statement:
        "Finally, accept the command only when the criterion is satisfied.",
      entityIds: ["entity-estimate", "entity-threshold", "entity-command"],
      relationIds: ["relation-support"],
      conditionIds: ["condition-criterion"]
    }
  ],
  reasonedCases: [
    {
      id: "case-current",
      kind: "example",
      scenario:
        "A current estimate remains inside the position-error boundary.",
      changedConditionIds: ["condition-delay"],
      givens: [
        {
          givenId: "given-delay",
          label: "Measured sensor delay",
          value: "20",
          unit: "ms",
          entityId: "entity-sensor"
        },
        {
          givenId: "given-error",
          label: "Independent position error",
          value: "0.04",
          unit: "m",
          entityId: "entity-estimate"
        }
      ],
      reasoningSteps: [
        {
          stepId: "example-step-1",
          statement: "The 20 ms delay remains below the 50 ms boundary.",
          entityIds: ["entity-sensor"],
          relationIds: ["relation-update"],
          conditionIds: ["condition-delay"]
        },
        {
          stepId: "example-step-2",
          statement:
            "The updated estimate is compared with the 0.10 m threshold.",
          entityIds: ["entity-estimate", "entity-threshold"],
          relationIds: ["relation-compare"],
          conditionIds: ["condition-boundary"]
        },
        {
          stepId: "example-step-3",
          statement:
            "The independent 0.04 m error remains below the accepted threshold.",
          entityIds: ["entity-estimate", "entity-command"],
          relationIds: ["relation-support"],
          conditionIds: ["condition-criterion"]
        }
      ],
      outcome: "The evidence supports accepting the motion command.",
      criterionConditionId: "condition-criterion",
      criterion:
        "Accept only while position error remains below 0.10 m.",
      verification:
        "Compare the estimated position with an independently measured current position."
    },
    {
      id: "case-stale",
      kind: "counterexample",
      scenario:
        "A visually smooth estimate is stale after a long sensor delay.",
      changedConditionIds: ["condition-delay", "condition-boundary"],
      givens: [
        {
          givenId: "given-stale-delay",
          label: "Measured sensor delay",
          value: "120",
          unit: "ms",
          entityId: "entity-sensor"
        },
        {
          givenId: "given-stale-error",
          label: "Independent position error",
          value: "0.18",
          unit: "m",
          entityId: "entity-estimate"
        }
      ],
      reasoningSteps: [
        {
          stepId: "counter-step-1",
          statement: "The 120 ms delay crosses the 50 ms timing boundary.",
          entityIds: ["entity-sensor"],
          relationIds: ["relation-update"],
          conditionIds: ["condition-delay"]
        },
        {
          stepId: "counter-step-2",
          statement:
            "The estimator can remain smooth while describing an earlier robot state.",
          entityIds: ["entity-estimate"],
          relationIds: ["relation-update"],
          conditionIds: ["condition-delay"]
        },
        {
          stepId: "counter-step-3",
          statement:
            "The 0.18 m independent error exceeds the 0.10 m criterion.",
          entityIds: ["entity-estimate", "entity-threshold"],
          relationIds: ["relation-compare"],
          conditionIds: ["condition-boundary"]
        }
      ],
      outcome: "The motion command must be rejected.",
      criterionConditionId: "condition-criterion",
      criterion:
        "Reject when position error is 0.10 m or greater.",
      verification:
        "Hold the command and compare against an independent current-position measurement."
    }
  ],
  misconception: {
    id: "misconception-smooth-is-current",
    claim: "A smooth estimate must be a current and accurate estimate.",
    mechanism:
      "Filtering removes visible noise, so smoothness can be mistaken for low delay and low error.",
    correction:
      "Smoothness describes variation, while currency and accuracy require timing and independent-error checks.",
    disconfirmingObservation:
      "A 120 ms delayed estimate can remain smooth while the independent error grows to 0.18 m.",
    entityIds: ["entity-sensor", "entity-estimate"],
    relationIds: ["relation-update"],
    conditionIds: ["condition-delay", "condition-boundary"]
  },
  assessments: {
    q2: {
      base: {
        prompt: "Order the evidence path before accepting a command.",
        contextConditionIds: ["condition-delay", "condition-criterion"],
        steps: [
          {
            stepId: "q2-base-measure",
            label: "Time-stamp the measurement",
            explanation: "The estimator needs the measurement time.",
            entityIds: ["entity-sensor"],
            relationIds: [],
            conditionIds: ["condition-delay"]
          },
          {
            stepId: "q2-base-update",
            label: "Update the estimate",
            explanation: "The measurement updates the robot state estimate.",
            entityIds: ["entity-sensor", "entity-estimate"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"]
          },
          {
            stepId: "q2-base-compare",
            label: "Apply the criterion",
            explanation: "The estimate is checked before command acceptance.",
            entityIds: ["entity-estimate", "entity-threshold", "entity-command"],
            relationIds: ["relation-compare", "relation-support"],
            conditionIds: ["condition-criterion"]
          }
        ],
        correctOrder: [
          "q2-base-measure",
          "q2-base-update",
          "q2-base-compare"
        ],
        ...feedback
      },
      retry: {
        prompt: "Order the rejection path after the delay boundary is crossed.",
        contextConditionIds: ["condition-delay", "condition-boundary"],
        steps: [
          {
            stepId: "q2-retry-detect",
            label: "Detect excessive delay",
            explanation: "The delay boundary is checked first.",
            entityIds: ["entity-sensor"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"]
          },
          {
            stepId: "q2-retry-check",
            label: "Check independent error",
            explanation: "The estimate is compared with independent evidence.",
            entityIds: ["entity-estimate", "entity-threshold"],
            relationIds: ["relation-compare"],
            conditionIds: ["condition-boundary"]
          },
          {
            stepId: "q2-retry-reject",
            label: "Reject the command",
            explanation: "Crossing the criterion prevents command acceptance.",
            entityIds: ["entity-command"],
            relationIds: ["relation-support"],
            conditionIds: ["condition-criterion"]
          }
        ],
        correctOrder: [
          "q2-retry-detect",
          "q2-retry-check",
          "q2-retry-reject"
        ],
        ...feedback
      }
    },
    q3: {
      base: {
        prompt: "Select every claim supported by the current-estimate case.",
        contextConditionIds: ["condition-delay", "condition-boundary"],
        options: [
          {
            optionId: "q3-base-timing",
            label: "The measured delay is inside the timing boundary.",
            isCorrect: true,
            explanation: "Twenty milliseconds is below 50 ms.",
            entityIds: ["entity-sensor"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"],
            misconceptionId: null
          },
          {
            optionId: "q3-base-error",
            label: "The independent error is inside the position boundary.",
            isCorrect: true,
            explanation: "The measured error is 0.04 m.",
            entityIds: ["entity-estimate", "entity-threshold"],
            relationIds: ["relation-compare"],
            conditionIds: ["condition-boundary"],
            misconceptionId: null
          },
          {
            optionId: "q3-base-smooth",
            label: "Visual smoothness alone proves the estimate is current.",
            isCorrect: false,
            explanation: "Smoothness does not measure delay.",
            entityIds: ["entity-estimate"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"],
            misconceptionId: "misconception-smooth-is-current"
          }
        ],
        ...feedback
      },
      retry: {
        prompt: "Select every claim supported by the stale-estimate case.",
        contextConditionIds: ["condition-delay", "condition-boundary"],
        options: [
          {
            optionId: "q3-retry-delay",
            label: "The delay boundary has been crossed.",
            isCorrect: true,
            explanation: "One hundred and twenty milliseconds exceeds 50 ms.",
            entityIds: ["entity-sensor"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"],
            misconceptionId: null
          },
          {
            optionId: "q3-retry-reject",
            label: "The command must be rejected.",
            isCorrect: true,
            explanation: "The observed error exceeds the criterion.",
            entityIds: ["entity-command", "entity-threshold"],
            relationIds: ["relation-support"],
            conditionIds: ["condition-criterion"],
            misconceptionId: null
          },
          {
            optionId: "q3-retry-smooth",
            label: "Smoothness overrides the measured error.",
            isCorrect: false,
            explanation: "Appearance cannot override the declared criterion.",
            entityIds: ["entity-estimate"],
            relationIds: ["relation-compare"],
            conditionIds: ["condition-boundary"],
            misconceptionId: "misconception-smooth-is-current"
          }
        ],
        ...feedback
      }
    },
    q4: {
      base: {
        kind: "short-response",
        prompt:
          "Explain why the current-estimate case supports accepting the command.",
        contextConditionIds: ["condition-delay", "condition-criterion"],
        conceptGroups: [
          {
            conceptId: "concept-estimate",
            label: "State estimate",
            acceptedPhrases: ["state estimate", "estimated pose"],
            entityIds: ["entity-estimate"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"]
          },
          {
            conceptId: "concept-delay",
            label: "Sensor delay",
            acceptedPhrases: ["sensor delay", "measurement latency"],
            entityIds: ["entity-sensor"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"]
          },
          {
            conceptId: "concept-error",
            label: "Position error",
            acceptedPhrases: ["position error", "pose error"],
            entityIds: ["entity-estimate", "entity-threshold"],
            relationIds: ["relation-compare"],
            conditionIds: ["condition-boundary"]
          }
        ],
        minimumConceptGroups: 3,
        requiredRelationIds: ["relation-compare"],
        criterionConditionId: "condition-criterion",
        exemplarResponse:
          "The state estimate uses a current measurement because sensor delay is low. The position error is checked because estimate is compared with threshold. Accept the command only when position error remains below 0.10 m.",
        ...feedback
      },
      retry: {
        kind: "matching",
        prompt: "Match each stale-estimate observation with its meaning.",
        contextConditionIds: ["condition-delay", "condition-boundary"],
        pairs: [
          {
            pairId: "pair-delay",
            leftLabel: "120 ms sensor delay",
            rightLabel: "Timing boundary crossed",
            explanation: "The delay exceeds the declared 50 ms boundary.",
            entityIds: ["entity-sensor"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"]
          },
          {
            pairId: "pair-error",
            leftLabel: "0.18 m position error",
            rightLabel: "Position boundary crossed",
            explanation: "The error exceeds the declared 0.10 m boundary.",
            entityIds: ["entity-estimate", "entity-threshold"],
            relationIds: ["relation-compare"],
            conditionIds: ["condition-boundary"]
          },
          {
            pairId: "pair-command",
            leftLabel: "Motion command",
            rightLabel: "Reject pending current evidence",
            explanation: "The failed criterion does not support the command.",
            entityIds: ["entity-command"],
            relationIds: ["relation-support"],
            conditionIds: ["condition-criterion"]
          }
        ],
        ...feedback
      }
    },
    q5: {
      base: {
        kind: "diagram",
        prompt: "Choose the implication supported by the active graph path.",
        contextConditionIds: ["condition-delay", "condition-criterion"],
        positions: [
          { entityId: "entity-sensor", column: 0, row: 0 },
          { entityId: "entity-estimate", column: 1, row: 0 },
          { entityId: "entity-threshold", column: 2, row: 0 },
          { entityId: "entity-command", column: 3, row: 0 }
        ],
        relationIds: [
          "relation-update",
          "relation-compare",
          "relation-support"
        ],
        answerRelationIds: ["relation-compare", "relation-support"],
        options: [
          {
            optionId: "q5-base-accept",
            label:
              "Accept only after the estimate passes the declared threshold.",
            isCorrect: true,
            reasoning: "The active comparison and support path justifies this.",
            entityIds: ["entity-estimate", "entity-threshold", "entity-command"],
            relationIds: ["relation-compare", "relation-support"],
            conditionIds: ["condition-criterion"],
            misconceptionId: null
          },
          {
            optionId: "q5-base-bypass",
            label: "Bypass the threshold when the graph looks smooth.",
            isCorrect: false,
            reasoning: "Smooth appearance is not a declared criterion.",
            entityIds: ["entity-estimate", "entity-command"],
            relationIds: ["relation-support"],
            conditionIds: ["condition-criterion"],
            misconceptionId: "misconception-smooth-is-current"
          },
          {
            optionId: "q5-base-ignore",
            label: "Ignore measurement timing after estimation.",
            isCorrect: false,
            reasoning: "Timing remains a boundary on the update relation.",
            entityIds: ["entity-sensor", "entity-estimate"],
            relationIds: ["relation-update"],
            conditionIds: ["condition-delay"],
            misconceptionId: "misconception-smooth-is-current"
          }
        ],
        textEquivalent:
          "Sensor measurement updates state estimate; state estimate is compared with the error threshold; the validated estimate and threshold support the motion command.",
        ...feedback
      },
      retry: {
        kind: "code-analysis",
        prompt: "Choose the implication supported by this static guard.",
        contextConditionIds: ["condition-delay", "condition-criterion"],
        language: "typescript",
        code:
          "const accepted = delayMs < 50 && positionErrorM < 0.10;",
        options: [
          {
            optionId: "q5-retry-both",
            label: "Both timing and position error must pass.",
            isCorrect: true,
            reasoning: "The logical AND requires both comparisons to be true.",
            entityIds: ["entity-sensor", "entity-estimate", "entity-command"],
            relationIds: ["relation-update", "relation-support"],
            conditionIds: ["condition-delay", "condition-criterion"],
            misconceptionId: null
          },
          {
            optionId: "q5-retry-one",
            label: "Either comparison is sufficient.",
            isCorrect: false,
            reasoning: "That would require logical OR, not logical AND.",
            entityIds: ["entity-command"],
            relationIds: ["relation-support"],
            conditionIds: ["condition-criterion"],
            misconceptionId: "misconception-smooth-is-current"
          },
          {
            optionId: "q5-retry-visual",
            label: "Visual smoothness overrides both comparisons.",
            isCorrect: false,
            reasoning: "The guard contains no visual-smoothness input.",
            entityIds: ["entity-estimate"],
            relationIds: ["relation-support"],
            conditionIds: ["condition-criterion"],
            misconceptionId: "misconception-smooth-is-current"
          }
        ],
        ...feedback
      }
    }
  },
  explorer: {
    title: "Change the delay and inspect the evidence path",
    description:
      "Choose an authored timing state and compare its active, suppressed and retained evidence.",
    modelKind: "causal-graph",
    controls: [
      {
        id: "control-current",
        label: "Current measurement",
        changedConditionIds: ["condition-delay"],
        state: {
          kind: "causal-graph",
          positions: [
            { entityId: "entity-sensor", column: 0, row: 0 },
            { entityId: "entity-estimate", column: 1, row: 0 },
            { entityId: "entity-threshold", column: 2, row: 0 },
            { entityId: "entity-command", column: 3, row: 0 }
          ],
          visibleEntityIds: [
            "entity-sensor",
            "entity-estimate",
            "entity-threshold",
            "entity-command"
          ],
          visibleRelationIds: [
            "relation-update",
            "relation-compare",
            "relation-support"
          ],
          activeEntityIds: [
            "entity-sensor",
            "entity-estimate",
            "entity-threshold",
            "entity-command"
          ],
          activeRelationIds: [
            "relation-update",
            "relation-compare",
            "relation-support"
          ],
          suppressedRelationIds: [],
          reversedRelationIds: [],
          annotations: [
            {
              annotationId: "annotation-current",
              label: "All declared checks remain active.",
              entityIds: ["entity-estimate", "entity-command"],
              relationIds: ["relation-compare", "relation-support"]
            }
          ]
        },
        outcome: "The current evidence path supports the command.",
        requiredAction:
          "Trace each active relation from measurement to decision.",
        retainedEvidence:
          "Retain the measured delay, independent error and criterion result.",
        textEquivalent:
          "The current measurement updates the estimate, which is compared with the threshold before the command is supported."
      },
      {
        id: "control-stale",
        label: "Stale measurement",
        changedConditionIds: ["condition-delay", "condition-boundary"],
        state: {
          kind: "causal-graph",
          positions: [
            { entityId: "entity-sensor", column: 0, row: 0 },
            { entityId: "entity-estimate", column: 1, row: 0 },
            { entityId: "entity-threshold", column: 2, row: 0 },
            { entityId: "entity-command", column: 3, row: 0 }
          ],
          visibleEntityIds: [
            "entity-sensor",
            "entity-estimate",
            "entity-threshold",
            "entity-command"
          ],
          visibleRelationIds: [
            "relation-update",
            "relation-compare",
            "relation-support"
          ],
          activeEntityIds: [
            "entity-sensor",
            "entity-estimate",
            "entity-threshold"
          ],
          activeRelationIds: ["relation-update", "relation-compare"],
          suppressedRelationIds: ["relation-support"],
          reversedRelationIds: [],
          annotations: [
            {
              annotationId: "annotation-stale",
              label: "The failed criterion suppresses command support.",
              entityIds: ["entity-estimate", "entity-command"],
              relationIds: ["relation-support"]
            }
          ]
        },
        outcome: "The stale evidence path does not support the command.",
        requiredAction:
          "Identify the crossed boundary before inspecting smoothness.",
        retainedEvidence:
          "Retain the failed delay and position-error checks.",
        textEquivalent:
          "The stale measurement still updates the estimate, but the failed boundary suppresses support for the motion command."
      }
    ]
  }
};

const identity = (
  questionKey: AcademyLessonV2QuestionKey,
  scenarioMode: AcademyLessonV2ScenarioMode = "base"
): AcademyLessonV2QuestionIdentity => ({
  lessonId: profile.lessonId,
  assessmentId: academyLessonV2AssessmentId(profile.lessonId),
  questionKey,
  questionId: academyLessonV2QuestionId(
    profile.lessonId,
    questionKey,
    scenarioMode
  ),
  scenarioMode,
  retryIndex: scenarioMode === "retry" ? 1 : 0
});

describe("AcademyLessonV2 learner renderer", () => {
  it("renders complete native teaching and every stable resume section", () => {
    const outline = buildAcademyLessonV2Outline(profile);
    expect(outline.map((item) => item.key)).toEqual([
      "overview",
      "terms",
      "conceptual-model",
      "reasoned-cases",
      "failure-boundary",
      "misconception",
      "explorer",
      "assessment"
    ]);
    expect(new Set(outline.map((item) => item.id)).size).toBe(outline.length);

    const html = renderToStaticMarkup(
      createElement(AcademyLessonV2, { profile })
    );

    for (const item of outline) {
      expect(item.id).toBe(academyLessonV2SectionId(profile.lessonId, item.key));
      expect(html).toContain(`id="${item.id}"`);
      expect(html).toContain(
        `data-academy-resume-block="${item.resumeBlockId}"`
      );
      expect(html).toContain(`href="#${item.id}"`);
    }

    expect(html).toContain("Self-contained beginner lesson");
    expect(html).toContain("State estimate");
    expect(html).toContain("<strong>Boundary:</strong>");
    expect(html).toContain("Conceptual walkthrough");
    expect(html).toContain("Worked example");
    expect(html).toContain("Counterexample");
    expect(html).toContain("Misconception clinic");
    expect(html).toContain("Why that claim can feel plausible");
    expect(html).toContain("Independent check");
  });

  it("renders Q2-Q5 base and retry controls, progressive support and text equivalents", () => {
    const html = renderToStaticMarkup(
      createElement(AcademyLessonV2, { profile })
    );

    expect(html).toContain("Q2 - Put the mechanism in order");
    expect(html).toContain("Q3 - Select every supported claim");
    expect(html).toContain("Q4 - Explain or match the relationships");
    expect(html).toContain("Q5 - Interpret the represented mechanism");
    expect(html.match(/Base scenario/g)?.length).toBe(4);
    expect(html.match(/Retry with changed conditions/g)?.length).toBe(4);
    expect(html).toContain("Show hint 1 of 2");
    expect(html).toContain("Show worked solution");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('type="radio"');
    expect(html).toContain("<textarea");
    expect(html).toContain("<select");
    expect(html).toContain("Static typescript code for analysis");
    expect(html).toContain('role="img"');
    expect(html).toContain("Accessible text equivalent");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Hint, solution, retry and attempt actions");
    expect(html).not.toMatch(/[.!?];/u);
  });

  it("restores persisted hints, worked solutions and retry disclosure state", () => {
    const baseQuestionId = academyLessonV2QuestionId(
      profile.lessonId,
      "q2",
      "base"
    );
    const retryQuestionId = academyLessonV2QuestionId(
      profile.lessonId,
      "q2",
      "retry"
    );
    const html = renderToStaticMarkup(
      createElement(AcademyLessonV2, {
        profile,
        initialInteractions: {
          [baseQuestionId]: {
            revealedHintCount: 2,
            solutionRevealed: true,
            retryOpened: false
          },
          [retryQuestionId]: {
            revealedHintCount: 0,
            solutionRevealed: false,
            retryOpened: true
          }
        },
        attemptHistory: {
          [baseQuestionId]: [{
            attemptId: "ATTEMPT-V2-001",
            attemptedAt: "2026-07-30T10:00:00.000Z",
            isCorrect: false,
            scorePercent: 50,
            retryIndex: 0,
            hintsUsed: [`${baseQuestionId}-H1`]
          }]
        }
      })
    );

    expect(html).toContain("Name the entities before deciding what changes.");
    expect(html).toContain("Apply the stated relation and then test the boundary.");
    expect(html).toContain("Hide worked solution");
    expect(html).toContain("Trace the measurement into the estimate.");
    expect(html).toContain("Question attempt history (1)");
    expect(html).toContain("Stored attempts for this exact base");
    expect(html).toContain("<td>50%</td>");
    expect(html).toMatch(
      /<details open=""><summary>Retry with changed conditions<\/summary>/u
    );
  });
});

describe("AcademyLessonV2 deterministic assessment grading", () => {
  it("grades Q2, Q3 and Q5 through the shared deterministic assessment core", () => {
    const q2 = gradeAcademyLessonV2Ordering(
      profile.assessments.q2.base,
      profile.assessments.q2.base.correctOrder,
      identity("q2"),
      profile.conditions
    );
    const q2Wrong = gradeAcademyLessonV2Ordering(
      profile.assessments.q2.base,
      [...profile.assessments.q2.base.correctOrder].reverse(),
      identity("q2"),
      profile.conditions
    );
    const q3 = gradeAcademyLessonV2Selection(
      profile.assessments.q3.base,
      new Set(["q3-base-timing", "q3-base-error"]),
      identity("q3"),
      profile.conditions
    );
    const q3Wrong = gradeAcademyLessonV2Selection(
      profile.assessments.q3.base,
      new Set(["q3-base-smooth"]),
      identity("q3"),
      profile.conditions
    );
    const q5 = gradeAcademyLessonV2Q5(
      profile.assessments.q5.base,
      "q5-base-accept",
      identity("q5"),
      profile
    );

    expect(q2).toMatchObject({ isCorrect: true, scorePercent: 100 });
    expect(q2Wrong.isCorrect).toBe(false);
    expect(q3).toMatchObject({ isCorrect: true, scorePercent: 100 });
    expect(q3Wrong).toMatchObject({
      isCorrect: false,
      misconceptionKeys: ["q3-base-smooth"]
    });
    expect(q5).toMatchObject({ isCorrect: true, scorePercent: 100 });
  });

  it("requires accepted concepts, every relation and the criterion in Q4 explanations", () => {
    const scenario = profile.assessments.q4.base;
    if (scenario.kind !== "short-response") {
      throw new Error("Fixture Q4 base must be a short response.");
    }
    const complete = gradeAcademyLessonV2ShortResponse(
      scenario,
      scenario.exemplarResponse,
      identity("q4"),
      profile.relations,
      profile.conditions
    );
    const missingRelation = gradeAcademyLessonV2ShortResponse(
      scenario,
      "The state estimate uses a current measurement because sensor delay is low. Position error is 0.04 m. Accept the command only when position error remains below 0.10 m.",
      identity("q4"),
      profile.relations,
      profile.conditions
    );
    const missingCriterion = gradeAcademyLessonV2ShortResponse(
      scenario,
      "The state estimate uses a current measurement because sensor delay is low. Position error is 0.04 m and estimate is compared with threshold.",
      identity("q4"),
      profile.relations,
      profile.conditions
    );
    const labelsOnly = gradeAcademyLessonV2ShortResponse(
      scenario,
      scenario.conceptGroups.map((group) => group.label).join(" "),
      identity("q4"),
      profile.relations,
      profile.conditions
    );

    expect(complete).toMatchObject({
      isCorrect: true,
      scorePercent: 100,
      matchedConceptGroupIds: [
        "concept-estimate",
        "concept-delay",
        "concept-error"
      ],
      missingRelationIds: [],
      criterionMatched: true
    });
    expect(missingRelation).toMatchObject({
      isCorrect: false,
      missingRelationIds: ["relation-compare"],
      criterionMatched: true
    });
    expect(missingCriterion).toMatchObject({
      isCorrect: false,
      missingRelationIds: [],
      criterionMatched: false
    });
    expect(labelsOnly.isCorrect).toBe(false);
  });

  it("uses stable matching IDs and rejects display labels as submitted values", () => {
    const scenario = profile.assessments.q4.retry;
    if (scenario.kind !== "matching") {
      throw new Error("Fixture Q4 retry must be matching.");
    }
    const stablePairs = Object.fromEntries(
      scenario.pairs.map((pair) => [
        pair.pairId,
        academyLessonV2MatchingRightId(pair.pairId)
      ])
    );
    const displayLabelPairs = Object.fromEntries(
      scenario.pairs.map((pair) => [pair.pairId, pair.rightLabel])
    );

    expect(
      gradeAcademyLessonV2Matching(
        scenario,
        stablePairs,
        identity("q4", "retry"),
        profile.conditions
      )
    ).toMatchObject({ isCorrect: true, scorePercent: 100 });
    expect(() =>
      gradeAcademyLessonV2Matching(
        scenario,
        displayLabelPairs,
        identity("q4", "retry"),
        profile.conditions
      )
    ).toThrow(/unknown id/u);
  });
});

const renderExplorer = (state: AcademyExplorerState): string => {
  const explorer = {
    ...profile.explorer,
    modelKind: state.kind,
    controls: [
      {
        ...profile.explorer.controls[0]!,
        id: `${state.kind}-one`,
        label: "Authored state one",
        state,
        textEquivalent: `${state.kind} accessible state one.`
      },
      {
        ...profile.explorer.controls[1]!,
        id: `${state.kind}-two`,
        label: "Authored state two",
        state,
        textEquivalent: `${state.kind} accessible state two.`
      }
    ]
  };
  return renderToStaticMarkup(
    createElement(AcademyLessonV2Explorer, {
      explorer,
      entities: profile.entities,
      relations: profile.relations,
      conditions: profile.conditions,
      sectionId: `${state.kind}-section`,
      resumeBlockId: `${state.kind}-section`
    })
  );
};

describe("AcademyLessonV2 typed explorers", () => {
  it("wraps complete graph labels instead of replacing learner-facing text with ellipses", () => {
    const html = renderToStaticMarkup(
      createElement(AcademyLessonV2DomainGraph, {
        positions: [
          { entityId: "entity-sensor", column: 0, row: 0 },
          { entityId: "entity-estimate", column: 1, row: 0 }
        ],
        relationIds: ["relation-update"],
        entities: profile.entities.map((entity) =>
          entity.entityId === "entity-estimate"
            ? { ...entity, label: "Velocity interpretation" }
            : entity
        ),
        relations: profile.relations,
        textEquivalent:
          "Sensor measurement updates the complete velocity interpretation."
      })
    );

    expect(html).toContain("<tspan");
    expect(html).toContain(">Velocity</tspan>");
    expect(html).toContain(">interpretation</tspan>");
    expect(html).not.toContain("Velocity interpretati...");
  });

  it.each(["causal-graph", "state-graph"] as const)(
    "renders the %s graph family with a visible text equivalent",
    (kind) => {
      const source = profile.explorer.controls[0]!.state;
      if (source.kind !== "causal-graph") {
        throw new Error("Fixture explorer must start as a causal graph.");
      }
      const html = renderExplorer({ ...source, kind });
      expect(html).toContain(`data-explorer-kind="${kind}"`);
      expect(html).toContain('role="img"');
      expect(html).toContain(`${kind} accessible state one.`);
      expect(html).toContain("Model annotations");
    }
  );

  it("renders the parameter-sweep family as an authored plot", () => {
    const html = renderExplorer({
      kind: "parameter-sweep",
      axes: [
        {
          axisId: "axis-delay",
          label: "Delay",
          unit: "ms",
          entityId: "entity-sensor"
        },
        {
          axisId: "axis-error",
          label: "Position error",
          unit: "m",
          entityId: "entity-estimate"
        }
      ],
      points: [
        {
          pointId: "point-current",
          x: 20,
          y: 0.04,
          label: "Current",
          conditionIds: ["condition-delay", "condition-boundary"]
        },
        {
          pointId: "point-edge",
          x: 50,
          y: 0.1,
          label: "Boundary",
          conditionIds: ["condition-delay", "condition-boundary"]
        },
        {
          pointId: "point-stale",
          x: 120,
          y: 0.18,
          label: "Stale",
          conditionIds: ["condition-delay", "condition-boundary"]
        }
      ],
      highlightedPointId: "point-edge",
      verification: "The highlighted point is the declared boundary."
    });
    expect(html).toContain('data-explorer-kind="parameter-sweep"');
    expect(html).toContain("Delay (ms)");
    expect(html).toContain("Position error (m)");
    expect(html).toContain('data-highlighted="true"');
    expect(html).toContain("parameter-sweep accessible state one.");
  });

  it("renders the geometry-transform family as points, segments and a frame", () => {
    const html = renderExplorer({
      kind: "geometry-transform",
      frameEntityId: "entity-estimate",
      points: [
        {
          pointId: "point-a",
          label: "A",
          x: 0,
          y: 0,
          entityId: "entity-sensor"
        },
        {
          pointId: "point-b",
          label: "B",
          x: 1,
          y: 1,
          entityId: "entity-estimate"
        },
        {
          pointId: "point-c",
          label: "C",
          x: 2,
          y: 0,
          entityId: "entity-threshold"
        }
      ],
      segments: [
        {
          segmentId: "segment-ab",
          fromPointId: "point-a",
          toPointId: "point-b",
          relationId: "relation-update"
        },
        {
          segmentId: "segment-bc",
          fromPointId: "point-b",
          toPointId: "point-c",
          relationId: "relation-compare"
        }
      ],
      verification: "The segment endpoints retain their authored relation."
    });
    expect(html).toContain('data-explorer-kind="geometry-transform"');
    expect(html).toContain('data-point-id="point-a"');
    expect(html).toContain("Reference frame: State estimate.");
    expect(html).toContain("geometry-transform accessible state one.");
  });

  it("renders the comparison-matrix family as a semantic table", () => {
    const html = renderExplorer({
      kind: "comparison-matrix",
      rowEntityIds: ["entity-estimate", "entity-command"],
      columnConditionIds: ["condition-delay", "condition-criterion"],
      cells: [
        {
          entityId: "entity-estimate",
          conditionId: "condition-delay",
          state: "supported",
          label: "Estimate timing is supported."
        },
        {
          entityId: "entity-estimate",
          conditionId: "condition-criterion",
          state: "not-observed",
          label: "Command criterion is not an estimate property."
        },
        {
          entityId: "entity-command",
          conditionId: "condition-delay",
          state: "outside-boundary",
          label: "Command is outside the timing boundary."
        },
        {
          entityId: "entity-command",
          conditionId: "condition-criterion",
          state: "contradicted",
          label: "Failed criterion contradicts command support."
        }
      ]
    });
    expect(html).toContain('data-explorer-kind="comparison-matrix"');
    expect(html).toContain("<table>");
    expect(html).toContain("<caption>comparison-matrix accessible state one.");
    expect(html).toContain('data-cell-state="supported"');
    expect(html).toContain('data-cell-state="outside-boundary"');
  });
});
