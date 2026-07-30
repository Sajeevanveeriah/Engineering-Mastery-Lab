import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { AcademyLessonBlockView } from "../components/academy/AcademyLessonBlock";
import {
  AcademyLessonV2,
  buildAcademyLessonV2Outline,
  type AcademyLessonV2OutlineItem,
  type AcademyLessonV2SectionKey
} from "../components/academy/AcademyLessonV2";
import {
  academyLessonV2AssessmentEventId,
  type AcademyLessonV2AssessmentEvent,
  type AcademyLessonV2AssessmentProgress,
  type AcademyLessonV2InitialQuestionInteractions
} from "../components/academy/AcademyLessonV2Assessment";
import {
  MobileLessonOutline,
  type MobileLessonOutlineItem
} from "../components/academy/MobileLessonOutline";
import type { AcademyQuestionAttempt } from "../components/academy/AcademyQuestion";
import {
  academyCourses,
  academySkills,
  academySources,
  academyUnits
} from "../data/academy/catalogue";
import type {
  AcademyLessonTeachingProfileV2
} from "../data/academy/lessonTeachingProfileV2";
import {
  academyLessonRoute,
  academyScrollOffset,
  academyUnitRoute,
  assessmentQuestionScores
} from "../lib/academy/navigation";
import { planAcademyMasteryEvidence } from "../lib/academy/masteryIntegration";
import { loadAcademyLesson } from "../lib/academy/curriculum";
import {
  academyLessonV2AssessmentId,
  academyLessonV2QuestionId,
  type AcademyLessonV2QuestionKey,
  type AcademyLessonV2ScenarioMode
} from "../lib/academy/lessonTeachingProfileV2Assessment";
import {
  loadAcademyLessonTeachingProfileV2UnitForLesson
} from "../lib/academy/lessonTeachingProfileV2Loader";
import type {
  AcademyQuestion,
  Lesson,
  LessonBlock,
  SourceReference
} from "../lib/academy/types";
import {
  recordAcademyAssessmentAttempt,
  recordAcademyQuestionAttempt,
  recordAcademySkillEvidence,
  setAcademyReviewState,
  startAcademyLabHandoff,
  updateAcademyQuestionInteraction,
  type AcademyProgressState,
  type ProgressState
} from "../lib/storage";

const PRE_ASSESSMENT_BLOCK_KINDS: ReadonlySet<LessonBlock["kind"]> = new Set([
  "image",
  "inline-math",
  "display-math",
  "derivation",
  "worked-example",
  "diagram",
  "media",
  "warning"
]);

const POST_ASSESSMENT_BLOCK_KINDS: ReadonlySet<LessonBlock["kind"]> = new Set([
  "laboratory-callout",
  "summary",
  "source-note"
]);

const V2_QUESTION_KEYS: readonly AcademyLessonV2QuestionKey[] = [
  "q2",
  "q3",
  "q4",
  "q5"
];

const V2_SCENARIO_MODES: readonly AcademyLessonV2ScenarioMode[] = [
  "base",
  "retry"
];

const V2_REQUIRED_SCORE_PERCENT = 80;
const V2_MAX_HINTS = 16;

type AcademyLessonV2AttemptEvent = Extract<
  AcademyLessonV2AssessmentEvent,
  { kind: "attempt" }
>;

function academyLessonV2ReceiptId(prefix: "ATTEMPT-V2" | "EV-V2", eventId: string): string {
  const receiptId = `${prefix}-${eventId.replace(/[^A-Za-z0-9._~-]+/gu, "-")}`;
  if (receiptId.length > 120) {
    throw new Error("Academy V2 assessment receipt identifier exceeds 120 characters.");
  }
  return receiptId;
}

export function academyLessonV2AttemptId(eventId: string): string {
  return academyLessonV2ReceiptId("ATTEMPT-V2", eventId);
}

function academyLessonV2EvidenceId(eventId: string): string {
  return academyLessonV2ReceiptId("EV-V2", eventId);
}

function assertCanonicalIsoTimestamp(value: string, path: string): void {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${path} must be a canonical ISO 8601 timestamp`);
  }
}

export function assertAcademyLessonV2AssessmentEvent(
  lessonId: string,
  event: AcademyLessonV2AssessmentEvent
): void {
  if (event.lessonId !== lessonId) {
    throw new Error("Academy V2 assessment event lessonId must match the open lesson");
  }
  if (!V2_QUESTION_KEYS.includes(event.questionKey)) {
    throw new Error("Academy V2 assessment event questionKey is invalid");
  }
  if (!V2_SCENARIO_MODES.includes(event.scenarioMode)) {
    throw new Error("Academy V2 assessment event scenarioMode is invalid");
  }
  const assessmentId = academyLessonV2AssessmentId(lessonId);
  if (event.assessmentId !== assessmentId) {
    throw new Error(
      "Academy V2 assessment event assessmentId must match the canonical assessment"
    );
  }
  const questionId = academyLessonV2QuestionId(
    lessonId,
    event.questionKey,
    event.scenarioMode
  );
  if (event.questionId !== questionId) {
    throw new Error(
      "Academy V2 assessment event questionId must match its canonical question identity"
    );
  }
  const retryIndex = event.scenarioMode === "retry" ? 1 : 0;
  if (event.retryIndex !== retryIndex) {
    throw new Error(
      "Academy V2 assessment event retryIndex must match its scenario mode"
    );
  }
  assertCanonicalIsoTimestamp(
    event.occurredAt,
    "Academy V2 assessment event occurredAt"
  );

  let ordinal: number;
  if (event.kind === "hint") {
    if (
      !Number.isSafeInteger(event.hintIndex)
      || event.hintIndex < 0
      || event.hintIndex >= V2_MAX_HINTS
    ) {
      throw new Error("Academy V2 assessment hintIndex is invalid");
    }
    ordinal = event.hintIndex + 1;
    if (event.hintId !== `${questionId}-H${ordinal}`) {
      throw new Error("Academy V2 assessment hintId must match its canonical hint identity");
    }
  } else if (event.kind === "solution") {
    ordinal = 1;
    if (event.solutionId !== `${questionId}-SOLUTION` || event.explicitReveal !== true) {
      throw new Error(
        "Academy V2 assessment solution event must be an explicit canonical reveal"
      );
    }
  } else if (event.kind === "retry") {
    ordinal = 1;
    if (event.scenarioMode !== "retry" || event.retryIndex !== 1) {
      throw new Error("Academy V2 assessment retry event must use the retry scenario");
    }
  } else {
    if (
      !Number.isSafeInteger(event.attemptNumber)
      || event.attemptNumber < 1
      || event.attemptNumber > 1_000_000
    ) {
      throw new Error("Academy V2 assessment attemptNumber is invalid");
    }
    if (
      !Number.isFinite(event.scorePercent)
      || event.scorePercent < 0
      || event.scorePercent > 100
    ) {
      throw new Error("Academy V2 assessment scorePercent must be from 0 to 100");
    }
    if (event.isCorrect !== (event.scorePercent === 100)) {
      throw new Error(
        "Academy V2 assessment isCorrect must agree with whether scorePercent is 100"
      );
    }
    if (
      !Number.isSafeInteger(event.variantSeed)
      || event.variantSeed < 0
      || event.variantSeed > 0xffff_ffff
    ) {
      throw new Error("Academy V2 assessment variantSeed is invalid");
    }
    if (
      typeof event.responseSummary !== "string"
      || event.responseSummary.trim() === ""
      || event.responseSummary.length > 2_000
    ) {
      throw new Error("Academy V2 assessment responseSummary is invalid");
    }
    if (
      event.hintsUsed.length > V2_MAX_HINTS
      || new Set(event.hintsUsed).size !== event.hintsUsed.length
      || event.hintsUsed.some(
        (hintId) => !new RegExp(
          `^${questionId.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}-H(?:[1-9]|1[0-6])$`,
          "u"
        ).test(hintId)
      )
    ) {
      throw new Error("Academy V2 assessment hintsUsed contains a non-canonical hint");
    }
    if (
      event.misconceptionKeys.length > 64
      || event.misconceptionKeys.some(
        (key) => typeof key !== "string" || key.trim() === "" || key.length > 240
      )
    ) {
      throw new Error("Academy V2 assessment misconceptionKeys is invalid");
    }
    ordinal = event.attemptNumber;
  }

  const expectedEventId = academyLessonV2AssessmentEventId(
    {
      lessonId,
      assessmentId,
      questionKey: event.questionKey,
      questionId,
      scenarioMode: event.scenarioMode,
      retryIndex
    },
    event.kind,
    ordinal,
    event.occurredAt
  );
  if (event.eventId !== expectedEventId) {
    throw new Error("Academy V2 assessment eventId must match its canonical event identity");
  }
}

export function assertAcademyLessonV2AssessmentProgress(
  lessonId: string,
  progress: AcademyLessonV2AssessmentProgress
): void {
  if (
    progress.lessonId !== lessonId
    || progress.assessmentId !== academyLessonV2AssessmentId(lessonId)
  ) {
    throw new Error("Academy V2 assessment progress must match the open lesson");
  }
  if (
    progress.total !== V2_QUESTION_KEYS.length
    || progress.attempted !== V2_QUESTION_KEYS.length
  ) {
    throw new Error("Academy V2 assessment progress must include all four questions");
  }
  if (
    !Number.isFinite(progress.scorePercent)
    || progress.scorePercent < 0
    || progress.scorePercent > 100
    || progress.requiredScorePercent !== V2_REQUIRED_SCORE_PERCENT
  ) {
    throw new Error("Academy V2 assessment progress score contract is invalid");
  }
  if (
    !progress.masteryEligible
    || progress.scorePercent < progress.requiredScorePercent
  ) {
    throw new Error("Academy V2 passed progress must satisfy the mastery threshold");
  }
}

export function deriveAcademyLessonV2InitialScores(
  lessonId: string,
  academy: Pick<
    AcademyProgressState,
    "questionAttempts" | "questionInteractions"
  >
): Partial<Record<AcademyLessonV2QuestionKey, number>> {
  const scores: Partial<Record<AcademyLessonV2QuestionKey, number>> = {};
  for (const questionKey of V2_QUESTION_KEYS) {
    const candidates: number[] = [];
    for (const scenarioMode of V2_SCENARIO_MODES) {
      const questionId = academyLessonV2QuestionId(
        lessonId,
        questionKey,
        scenarioMode
      );
      const interactionScore = academy.questionInteractions[
        questionId
      ]?.lastAttemptScorePercent;
      if (interactionScore !== null && interactionScore !== undefined) {
        candidates.push(interactionScore);
      }
      for (const attempt of academy.questionAttempts[questionId] ?? []) {
        candidates.push(attempt.scorePercent);
      }
    }
    if (candidates.length > 0) scores[questionKey] = Math.max(...candidates);
  }
  return scores;
}

function latestAcademyLessonV2AttemptAt(
  lessonId: string,
  academy: Pick<AcademyProgressState, "questionAttempts">
): string | null {
  let latest: string | null = null;
  for (const questionKey of V2_QUESTION_KEYS) {
    for (const scenarioMode of V2_SCENARIO_MODES) {
      const questionId = academyLessonV2QuestionId(
        lessonId,
        questionKey,
        scenarioMode
      );
      for (const attempt of academy.questionAttempts[questionId] ?? []) {
        if (latest === null || Date.parse(attempt.attemptedAt) > Date.parse(latest)) {
          latest = attempt.attemptedAt;
        }
      }
    }
  }
  return latest;
}

export function applyAcademyLessonV2AttemptEvent(
  state: ProgressState,
  lesson: Lesson,
  profile: AcademyLessonTeachingProfileV2,
  event: AcademyLessonV2AttemptEvent
): ProgressState {
  assertAcademyLessonV2AssessmentEvent(lesson.id, event);
  const attemptId = academyLessonV2AttemptId(event.eventId);
  let next = updateAcademyQuestionInteraction(state, {
    questionId: event.questionId,
    contextId: event.assessmentId,
    scenarioMode: event.scenarioMode,
    retryIndex: event.retryIndex,
    timestamp: event.occurredAt,
    kind: "attempt",
    scorePercent: event.scorePercent,
    isCorrect: event.isCorrect,
    revealedHintIds: event.hintsUsed,
    solutionRevealed: event.solutionRevealed
  });
  next = recordAcademyAssessmentAttempt(next, {
    attemptId,
    assessmentId: event.assessmentId,
    responseSummary: { [event.questionId]: event.responseSummary },
    scorePercent: event.scorePercent,
    hintsUsed: event.hintsUsed,
    feedbackState: "shown",
    revealState: event.solutionRevealed ? "revealed" : "hidden",
    startedAt: event.occurredAt,
    submittedAt: event.occurredAt
  });
  next = recordAcademyQuestionAttempt(next, {
    attemptId,
    contextId: event.assessmentId,
    questionId: event.questionId,
    questionType: v2QuestionType(profile, event.questionKey, event.scenarioMode),
    attemptedAt: event.occurredAt,
    responseSummary: event.responseSummary,
    isCorrect: event.isCorrect,
    scorePercent: event.scorePercent,
    misconceptionKeys: event.misconceptionKeys,
    variantSeed: event.variantSeed,
    retryIndex: event.retryIndex,
    hintsUsed: event.hintsUsed
  });

  const evidenceId = academyLessonV2EvidenceId(event.eventId);
  for (const skillId of lesson.skillIds) {
    const skill = academySkills.find((candidate) => candidate.id === skillId);
    if (!skill) continue;
    const expectedEvidence = {
      evidenceId,
      kind: "guided-practice" as const,
      referenceId: event.assessmentId,
      summary: `${lesson.title} guided practice recorded at ${event.scorePercent}%.`,
      recordedAt: event.occurredAt,
      scorePercent: event.scorePercent
    };
    const existingEvidence = next.academy.skillRecords[skillId]?.evidence.find(
      (candidate) => candidate.evidenceId === evidenceId
    );
    if (existingEvidence) {
      if (JSON.stringify(existingEvidence) !== JSON.stringify(expectedEvidence)) {
        throw new Error(
          `Academy V2 assessment event conflicts with mastery evidence ${evidenceId}`
        );
      }
      continue;
    }
    const plan = planAcademyMasteryEvidence(
      next.academy,
      skill,
      expectedEvidence,
      event.occurredAt
    );
    next = recordAcademySkillEvidence(next, plan);
    if (plan.reviewDueAt === null) continue;
    const reviewId = `REVIEW-${skill.id}`;
    const currentReview = next.academy.reviewStates[reviewId];
    if (currentReview && currentReview.state !== "scheduled") continue;
    next = setAcademyReviewState(next, {
      reviewId,
      targetType: "skill",
      targetId: skill.id,
      state: "scheduled",
      dueAt: plan.reviewDueAt,
      lastReviewedAt: currentReview?.lastReviewedAt ?? null,
      updatedAt: event.occurredAt
    });
  }
  return next;
}

const LEGACY_BLOCK_SECTION_MAP: Readonly<
  Record<string, AcademyLessonV2SectionKey>
> = {
  "BLOCK-INTRO": "overview",
  "BLOCK-DEFINITION": "terms",
  "BLOCK-EXAMPLE": "reasoned-cases",
  "BLOCK-VISUAL": "explorer",
  "BLOCK-CONCEPT": "conceptual-model",
  "BLOCK-MISCONCEPTION": "misconception",
  "BLOCK-CHECK": "assessment",
  "BLOCK-PRACTICE": "assessment"
};

export function resolveAcademyLessonResumeBlockId(
  lessonId: string,
  requestedBlockId: string | null | undefined,
  availableBlockIds: ReadonlySet<string>,
  v2Outline: readonly AcademyLessonV2OutlineItem[]
): string | null {
  if (!requestedBlockId) return null;
  if (availableBlockIds.has(requestedBlockId)) return requestedBlockId;
  const prefix = `${lessonId}-`;
  if (!requestedBlockId.startsWith(prefix)) return null;
  const sectionKey = LEGACY_BLOCK_SECTION_MAP[
    requestedBlockId.slice(prefix.length)
  ];
  return sectionKey
    ? v2Outline.find((item) => item.key === sectionKey)?.id ?? null
    : null;
}

function lessonBlockLabel(block: LessonBlock): string {
  switch (block.kind) {
    case "image":
      return block.caption;
    case "inline-math":
      return "Mathematical relationship";
    case "display-math":
      return "Governing equation";
    case "derivation":
      return "Equation derivation";
    case "worked-example":
      return block.example.title;
    case "diagram":
      return block.title;
    case "media":
      return "Optional inline media";
    case "warning":
      return block.heading;
    case "laboratory-callout":
      return block.title;
    case "summary":
      return "Lesson summary";
    case "source-note":
      return "Sources and attribution";
    default:
      return block.kind.replaceAll("-", " ");
  }
}

function v2QuestionType(
  profile: AcademyLessonTeachingProfileV2,
  questionKey: AcademyLessonV2QuestionKey,
  scenarioMode: AcademyLessonV2ScenarioMode
): AcademyQuestion["type"] {
  if (questionKey === "q2") return "ordering";
  if (questionKey === "q3") return "multiple-selection";
  if (questionKey === "q4") {
    return profile.assessments.q4[scenarioMode].kind;
  }
  return profile.assessments.q5[scenarioMode].kind === "diagram"
    ? "diagram"
    : "code-analysis";
}

function uniqueId(prefix: string): string {
  const random = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${prefix}-${random}`;
}

function routeForLesson(lessonId: string | null): string | null {
  if (!lessonId) return null;
  const unit = academyUnits.find((candidate) => candidate.lessonIds.includes(lessonId));
  return unit ? academyLessonRoute(unit.courseId, unit.id, lessonId) : null;
}

export function AcademyLessonPage() {
  const { courseId = "", unitId = "", lessonId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const {
    progress,
    update,
    startLesson,
    updateLesson,
    recordAssessmentAttempt,
    recordQuestionAttempt,
    updateQuestionInteraction,
    recordSkillEvidence,
    setResumeCursor,
    setLessonNotes,
    setLessonBookmarked,
    setReviewState
  } = useProgress();
  const [lesson, setLesson] = useState<Lesson | null | undefined>(undefined);
  const [teachingProfile, setTeachingProfile] = useState<
    AcademyLessonTeachingProfileV2 | null | undefined
  >(undefined);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notes, setNotes] = useState("");
  const lastTrackedBlock = useRef("");
  const lastScrollPosition = useRef(-1);
  const initialisedLessonId = useRef("");
  const scrollFrame = useRef<number | null>(null);
  const restoringPosition = useRef(false);
  const restoreToken = useRef(0);

  const course = academyCourses.find((candidate) => candidate.id === courseId);
  const unit = academyUnits.find((candidate) => candidate.id === unitId);
  const routeIsValid = Boolean(
    course
    && unit
    && unit.courseId === course.id
    && unit.lessonIds.includes(lessonId)
  );
  const loadedLessonMatchesRoute = Boolean(
    lesson
    && lesson.id === lessonId
    && lesson.unitId === unitId
  );
  const loadedProfileMatchesRoute = Boolean(
    teachingProfile
    && teachingProfile.lessonId === lessonId
  );
  const record = progress.academy.lessonRecords[lessonId];
  const sources = useMemo(
    () => new Map<string, SourceReference>(academySources.map((source) => [source.id, source])),
    []
  );
  const preAssessmentBlocks = useMemo(
    () => lesson?.blocks.filter((block) => PRE_ASSESSMENT_BLOCK_KINDS.has(block.kind)) ?? [],
    [lesson]
  );
  const postAssessmentBlocks = useMemo(
    () => lesson?.blocks.filter((block) => POST_ASSESSMENT_BLOCK_KINDS.has(block.kind)) ?? [],
    [lesson]
  );
  const v2Outline = useMemo(
    () => teachingProfile ? buildAcademyLessonV2Outline(teachingProfile) : [],
    [teachingProfile]
  );
  const retrievalBlockId = `${lessonId}-RETRIEVAL`;
  const notesBlockId = `${lessonId}-NOTES`;
  const outlineItems = useMemo<MobileLessonOutlineItem[]>(() => {
    const assessmentIndex = v2Outline.findIndex((item) => item.key === "assessment");
    const beforeAssessment = assessmentIndex >= 0
      ? v2Outline.slice(0, assessmentIndex)
      : v2Outline;
    const assessment = assessmentIndex >= 0
      ? [v2Outline[assessmentIndex]]
      : [];
    return [
      ...beforeAssessment.map((item) => ({ id: item.id, label: item.title })),
      ...preAssessmentBlocks.map((block) => ({
        id: block.id,
        label: lessonBlockLabel(block)
      })),
      ...assessment.map((item) => ({ id: item.id, label: item.title })),
      ...postAssessmentBlocks.map((block) => ({
        id: block.id,
        label: lessonBlockLabel(block)
      })),
      { id: retrievalBlockId, label: "Retrieval for later review" },
      { id: notesBlockId, label: "Local lesson notes" }
    ];
  }, [
    notesBlockId,
    postAssessmentBlocks,
    preAssessmentBlocks,
    retrievalBlockId,
    v2Outline
  ]);

  useEffect(() => {
    let cancelled = false;
    restoreToken.current += 1;
    restoringPosition.current = false;
    initialisedLessonId.current = "";
    setLesson(undefined);
    setTeachingProfile(undefined);
    setLoadError("");
    if (!routeIsValid) {
      setLesson(null);
      setTeachingProfile(null);
      return () => {
        cancelled = true;
        restoreToken.current += 1;
        restoringPosition.current = false;
      };
    }
    void Promise.all([
      loadAcademyLesson(lessonId),
      loadAcademyLessonTeachingProfileV2UnitForLesson(lessonId)
    ])
      .then(([loaded, loadedTeaching]) => {
        if (cancelled) return;
        setLesson(loaded);
        setTeachingProfile(loadedTeaching.profile);
        if (!loaded) {
          setLoadError("The lesson body did not resolve from its stage bundle.");
        }
      })
      .catch((caught) => {
        if (cancelled) return;
        setLesson(null);
        setTeachingProfile(null);
        setLoadError(caught instanceof Error ? caught.message : "The lesson could not be loaded.");
      });
    return () => {
      cancelled = true;
      restoreToken.current += 1;
      restoringPosition.current = false;
    };
  }, [lessonId, routeIsValid]);

  useEffect(() => {
    if (
      !lesson
      || !teachingProfile
      || !course
      || !unit
      || !loadedLessonMatchesRoute
      || !loadedProfileMatchesRoute
      || outlineItems.length === 0
    ) return;
    if (initialisedLessonId.current === lesson.id) return;
    initialisedLessonId.current = lesson.id;
    const resumeBlockIds = new Set(outlineItems.map((item) => item.id));
    const requestedBlock = searchParams.get("resume");
    const resolvedRequestedBlock = resolveAcademyLessonResumeBlockId(
      lesson.id,
      requestedBlock,
      resumeBlockIds,
      v2Outline
    );
    const requestedBlockIsValid = resolvedRequestedBlock !== null;
    const savedCursor = progress.academy.resumeCursor?.lessonId === lesson.id
      ? progress.academy.resumeCursor
      : null;
    const savedBlock = savedCursor?.blockId ?? record?.lastBlockId;
    const resolvedSavedBlock = resolveAcademyLessonResumeBlockId(
      lesson.id,
      savedBlock,
      resumeBlockIds,
      v2Outline
    );
    const blockId = requestedBlockIsValid
      ? resolvedRequestedBlock
      : resolvedSavedBlock
        ? resolvedSavedBlock
        : outlineItems[0]?.id;
    if (!blockId) return;
    const timestamp = new Date().toISOString();
    startLesson({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      timestamp,
      blockId
    });
    setResumeCursor({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      timestamp,
      blockId
    });
    setNotes(record?.notes ?? "");
    lastTrackedBlock.current = blockId;
    lastScrollPosition.current = record?.scrollPosition ?? 0;
    const storedScrollPosition = savedCursor !== null
      && !requestedBlockIsValid
      && savedBlock === resolvedSavedBlock
      ? record?.scrollPosition
      : undefined;
    restoringPosition.current = true;
    const currentRestoreToken = ++restoreToken.current;
    requestAnimationFrame(() => {
      if (currentRestoreToken !== restoreToken.current) return;
      const scrollOffset = academyScrollOffset(
        storedScrollPosition,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      if (scrollOffset === null) {
        document.getElementById(blockId)?.scrollIntoView({ block: "start" });
      } else {
        window.scrollTo({ top: scrollOffset, behavior: "auto" });
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (currentRestoreToken === restoreToken.current) {
            restoringPosition.current = false;
          }
        });
      });
    });
  }, [
    course,
    lesson,
    loadedLessonMatchesRoute,
    loadedProfileMatchesRoute,
    outlineItems,
    progress.academy.resumeCursor,
    record?.lastBlockId,
    record?.notes,
    record?.scrollPosition,
    searchParams,
    setResumeCursor,
    startLesson,
    teachingProfile,
    unit,
    v2Outline
  ]);

  const recordPosition = useCallback(() => {
    if (restoringPosition.current) return;
    if (
      !lesson
      || !teachingProfile
      || !course
      || !unit
      || !loadedLessonMatchesRoute
      || !loadedProfileMatchesRoute
    ) return;
    const nodes = outlineItems
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;
    const targetLine = window.innerHeight * 0.28;
    const nearest = nodes.reduce((best, candidate) => (
      Math.abs(candidate.getBoundingClientRect().top - targetLine)
        < Math.abs(best.getBoundingClientRect().top - targetLine)
        ? candidate
        : best
    ));
    const maximumScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollPosition = Math.min(1, Math.max(0, window.scrollY / maximumScroll));
    const blockChanged = nearest.id !== lastTrackedBlock.current;
    const scrollChanged = Math.abs(scrollPosition - lastScrollPosition.current) >= 0.02;
    if (!blockChanged && !scrollChanged) return;
    lastTrackedBlock.current = nearest.id;
    lastScrollPosition.current = scrollPosition;
    const timestamp = new Date().toISOString();
    updateLesson({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      timestamp,
      lastBlockId: nearest.id,
      scrollPosition
    });
    if (blockChanged) {
      setResumeCursor({
        courseId: course.id,
        unitId: unit.id,
        lessonId: lesson.id,
        timestamp,
        blockId: nearest.id
      });
    }
  }, [
    course,
    lesson,
    loadedLessonMatchesRoute,
    loadedProfileMatchesRoute,
    outlineItems,
    setResumeCursor,
    teachingProfile,
    unit,
    updateLesson
  ]);

  useEffect(() => {
    if (!lesson) return;
    const onScroll = () => {
      if (scrollFrame.current !== null) return;
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        recordPosition();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    };
  }, [lesson, recordPosition]);

  const scheduleReview = useCallback((
    skillId: string,
    reviewDueAt: string | null,
    timestamp: string
  ) => {
    if (!reviewDueAt) return;
    const reviewId = `REVIEW-${skillId}`;
    const current = progress.academy.reviewStates[reviewId];
    if (current && current.state !== "scheduled") return;
    setReviewState({
      reviewId,
      targetType: "skill",
      targetId: skillId,
      state: "scheduled",
      dueAt: reviewDueAt,
      lastReviewedAt: current?.lastReviewedAt ?? null,
      updatedAt: timestamp
    });
  }, [progress.academy.reviewStates, setReviewState]);

  const recordMastery = useCallback((
    kind: "knowledge-check" | "guided-practice" | "applied-evidence",
    referenceId: string,
    scorePercent?: number,
    receipt?: Readonly<{ evidenceId: string; recordedAt: string }>
  ) => {
    if (!lesson) return;
    const timestamp = receipt?.recordedAt ?? new Date().toISOString();
    for (const skillId of lesson.skillIds) {
      const skill = academySkills.find((candidate) => candidate.id === skillId);
      if (!skill) continue;
      try {
        const evidence = {
          evidenceId: receipt?.evidenceId ?? uniqueId("EV"),
          kind,
          referenceId,
          summary: kind === "applied-evidence"
            ? `Learner-attested local applied evidence recorded for ${lesson.title}; not independently verified proof.`
            : `${lesson.title} ${kind.replaceAll("-", " ")} recorded at ${scorePercent ?? 0}%.`,
          recordedAt: timestamp,
          ...(scorePercent === undefined ? {} : { scorePercent }),
          ...(kind === "applied-evidence" ? { passed: true as const } : {})
        };
        const receiptId = receipt?.evidenceId;
        const existingEvidence = receiptId
          ? progress.academy.skillRecords[skillId]?.evidence.find(
              (candidate) => candidate.evidenceId === receiptId
            )
          : undefined;
        if (existingEvidence) {
          if (JSON.stringify(existingEvidence) !== JSON.stringify(evidence)) {
            throw new Error(
              `Mastery receipt ${receiptId} conflicts with stored evidence.`
            );
          }
          continue;
        }
        const plan = planAcademyMasteryEvidence(
          progress.academy,
          skill,
          evidence,
          timestamp
        );
        recordSkillEvidence(plan);
        scheduleReview(skill.id, plan.reviewDueAt, timestamp);
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : "Mastery evidence could not be recorded.");
      }
    }
  }, [lesson, progress.academy, recordSkillEvidence, scheduleReview]);

  const handleQuestionAttempt = useCallback((
    blockId: string,
    result: AcademyQuestionAttempt
  ) => {
    const submittedAt = new Date().toISOString();
    const attemptId = uniqueId("ATTEMPT");
    recordAssessmentAttempt({
      attemptId,
      assessmentId: blockId,
      responseSummary: { [result.question.id]: result.attempt.responseSummary },
      scorePercent: result.grade.scorePercent,
      hintsUsed: result.hintIds,
      feedbackState: "shown",
      revealState: "hidden",
      startedAt: result.attempt.attemptedAt,
      submittedAt
    });
    recordQuestionAttempt({
      attemptId,
      contextId: blockId,
      questionId: result.question.id,
      questionType: result.question.type,
      attemptedAt: result.attempt.attemptedAt,
      responseSummary: result.attempt.responseSummary,
      isCorrect: result.grade.isCorrect,
      scorePercent: result.grade.scorePercent,
      misconceptionKeys: result.grade.misconceptionKeys,
      variantSeed: result.presentationVariantSeed,
      retryIndex: result.retryIndex,
      hintsUsed: result.hintIds
    });
    const block = lesson?.blocks.find((candidate) => candidate.id === blockId);
    recordMastery(
      block?.kind === "practice-set" ? "guided-practice" : "knowledge-check",
      blockId,
      result.grade.scorePercent
    );
  }, [
    lesson?.blocks,
    recordAssessmentAttempt,
    recordMastery,
    recordQuestionAttempt
  ]);

  const markRequirement = useCallback((
    field: "knowledgeChecksPassed" | "practiceCompleted"
  ) => {
    if (!lesson || !course || !unit) return;
    updateLesson({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      timestamp: new Date().toISOString(),
      requirements: { [field]: true }
    });
  }, [course, lesson, unit, updateLesson]);

  const v2InitialScores = useMemo<
    Partial<Record<AcademyLessonV2QuestionKey, number>>
  >(
    () => deriveAcademyLessonV2InitialScores(lessonId, progress.academy),
    [lessonId, progress.academy]
  );

  const v2InitialInteractions = useMemo<
    AcademyLessonV2InitialQuestionInteractions
  >(() => {
    const interactions: Record<
      string,
      AcademyLessonV2InitialQuestionInteractions[string]
    > = {};
    for (const questionKey of V2_QUESTION_KEYS) {
      for (const scenarioMode of V2_SCENARIO_MODES) {
        const questionId = academyLessonV2QuestionId(
          lessonId,
          questionKey,
          scenarioMode
        );
        const record = progress.academy.questionInteractions[questionId];
        if (!record) continue;
        interactions[questionId] = {
          revealedHintCount: record.revealedHintCount,
          solutionRevealed: record.solutionRevealed,
          retryOpened: record.retryOpened
        };
      }
    }
    return interactions;
  }, [lessonId, progress.academy.questionInteractions]);

  const handleV2AssessmentEvent = useCallback((
    event: AcademyLessonV2AssessmentEvent
  ) => {
    if (!lesson || !teachingProfile) return;
    try {
      assertAcademyLessonV2AssessmentEvent(lesson.id, event);
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Academy V2 assessment event could not be validated."
      );
      return;
    }
    setActionError("");
    const identity = {
      questionId: event.questionId,
      contextId: event.assessmentId,
      scenarioMode: event.scenarioMode,
      retryIndex: event.retryIndex,
      timestamp: event.occurredAt
    } as const;
    if (event.kind === "hint") {
      updateQuestionInteraction({
        ...identity,
        kind: "hint",
        hintId: event.hintId
      });
      return;
    }
    if (event.kind === "solution") {
      updateQuestionInteraction({
        ...identity,
        kind: "solution"
      });
      return;
    }
    if (event.kind === "retry") {
      updateQuestionInteraction({
        ...identity,
        kind: "retry"
      });
      return;
    }

    update((current) =>
      applyAcademyLessonV2AttemptEvent(
        current,
        lesson,
        teachingProfile,
        event
      )
    );
  }, [
    lesson,
    teachingProfile,
    update,
    updateQuestionInteraction
  ]);

  const handleV2AssessmentPassed = useCallback((
    assessmentProgress: AcademyLessonV2AssessmentProgress
  ) => {
    if (!lesson || !course || !unit) return;
    try {
      assertAcademyLessonV2AssessmentProgress(lesson.id, assessmentProgress);
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Academy V2 assessment progress could not be validated."
      );
      return;
    }
    setActionError("");
    updateLesson({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      timestamp: new Date().toISOString(),
      requirements: {
        knowledgeChecksPassed: true,
        practiceCompleted: true
      }
    });
    recordMastery(
      "knowledge-check",
      assessmentProgress.assessmentId,
      assessmentProgress.scorePercent,
      {
        evidenceId: `EV-V2-PASS-${assessmentProgress.assessmentId}-${assessmentProgress.scorePercent}`,
        recordedAt: latestAcademyLessonV2AttemptAt(
          lesson.id,
          progress.academy
        ) ?? new Date().toISOString()
      }
    );
  }, [course, lesson, progress.academy, recordMastery, unit, updateLesson]);

  const handleLaboratoryOpen = useCallback((blockId: string) => {
    if (!lesson || !course || !unit) return;
    if (record?.requirements.appliedEvidenceSatisfied) return;
    const timestamp = new Date().toISOString();
    update((state) => startAcademyLabHandoff(state, {
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      labId: blockId,
      blockId,
      timestamp
    }));
  }, [
    course,
    lesson,
    record?.requirements.appliedEvidenceSatisfied,
    unit,
    update
  ]);

  const saveNotes = () => {
    if (!lesson || !course || !unit) return;
    setLessonNotes({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      notes,
      timestamp: new Date().toISOString()
    });
  };

  const toggleBookmark = () => {
    if (!lesson || !course || !unit) return;
    setLessonBookmarked({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      bookmarked: !record?.bookmarked,
      timestamp: new Date().toISOString()
    });
  };

  const recordVideoPosition = useCallback((
    mediaId: string,
    positionSeconds: number,
    durationSeconds: number | null
  ) => {
    if (!lesson || !course || !unit || !loadedLessonMatchesRoute) return;
    updateLesson({
      courseId: course.id,
      unitId: unit.id,
      lessonId: lesson.id,
      timestamp: new Date().toISOString(),
      videoPosition: {
        mediaId,
        positionSeconds,
        durationSeconds
      }
    });
  }, [course, lesson, loadedLessonMatchesRoute, unit, updateLesson]);

  if (
    lesson === undefined
    || teachingProfile === undefined
    || (lesson !== null && !loadedLessonMatchesRoute)
    || (teachingProfile !== null && !loadedProfileMatchesRoute)
  ) {
    return (
      <section className="page">
        <PageHeader
          eyebrow="Academy lesson"
          title="Loading complete lesson"
          description="Loading the selected stage teaching bundle from this application."
        />
        <p role="status">Preparing native teaching, examples and practice...</p>
      </section>
    );
  }

  if (!routeIsValid || !lesson || !teachingProfile || !course || !unit) {
    return (
      <section className="page">
        <PageHeader
          eyebrow="Academy lesson"
          title="Lesson not found"
          description={loadError || "The requested course, unit and lesson combination is not valid."}
        />
        <Link className="btn" to="/learn/courses">Return to academy</Link>
      </section>
    );
  }

  const previousRoute = routeForLesson(lesson.previousLessonId);
  const nextRoute = routeForLesson(lesson.nextLessonId);
  const requirements = record?.requirements ?? {
    knowledgeChecksPassed: false,
    practiceCompleted: false,
    appliedEvidenceSatisfied: false
  };
  const renderSupplementalBlock = (block: LessonBlock) => {
    const attempts = progress.academy.assessmentAttempts[block.id] ?? [];
    return (
      <div id={block.id} key={block.id} className="academy-lesson-block-anchor">
        <AcademyLessonBlockView
          lesson={lesson}
          block={block}
          sources={sources}
          initialScores={assessmentQuestionScores(attempts)}
          attemptHistory={progress.academy.questionAttempts}
          onQuestionAttempt={handleQuestionAttempt}
          onKnowledgePassed={() => markRequirement("knowledgeChecksPassed")}
          onPracticePassed={() => markRequirement("practiceCompleted")}
          academyReturn={`${academyLessonRoute(
            course.id,
            unit.id,
            lesson.id
          )}?${new URLSearchParams({ resume: block.id }).toString()}`}
          appliedEvidenceSatisfied={requirements.appliedEvidenceSatisfied}
          onLaboratoryOpen={handleLaboratoryOpen}
          initialVideoPositions={Object.fromEntries(
            Object.entries(record?.videoPositions ?? {}).map(
              ([mediaId, position]) => [mediaId, position.positionSeconds]
            )
          )}
          onVideoPosition={recordVideoPosition}
        />
      </div>
    );
  };

  return (
    <section className="page academy-lesson-page">
      <nav className="academy-breadcrumbs" aria-label="Academy breadcrumb">
        <Link to="/learn/courses">Academy</Link><span aria-hidden="true">/</span>
        <Link to={`/learn/courses/${course.id}`}>{course.stage}</Link><span aria-hidden="true">/</span>
        <Link to={academyUnitRoute(course.id, unit.id)}>{unit.id}</Link><span aria-hidden="true">/</span>
        <span>{lesson.id}</span>
      </nav>

      <div className="academy-lesson-layout">
        <aside className="academy-lesson-outline" aria-label="Lesson outline">
          <p className="eyebrow">Lesson outline</p>
          <ol>
            {outlineItems.map((item, index) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
          <div className="academy-lesson-outline__gates">
            <strong>Completion gates</strong>
            <span>{requirements.knowledgeChecksPassed ? "Complete" : "Open"}: knowledge checks</span>
            <span>{requirements.practiceCompleted ? "Complete" : "Open"}: lesson practice</span>
            <span>{requirements.appliedEvidenceSatisfied ? "Complete" : "Open"}: applied evidence</span>
          </div>
        </aside>

        <MobileLessonOutline items={outlineItems} requirements={requirements} />

        <article className="academy-lesson-content">
          <header className="academy-lesson-header">
            <PageHeader
              eyebrow={`${lesson.id} - ${lesson.estimatedMinutes} min`}
              title={lesson.title}
              description={lesson.description}
            />
            <div className="academy-lesson-header__actions">
              <button className="btn secondary" type="button" onClick={toggleBookmark}>
                {record?.bookmarked ? "Remove bookmark" : "Bookmark lesson"}
              </button>
              <span className={`badge ${record?.completionEarned ? "success" : ""}`}>
                {record?.completionEarned ? "Lesson complete" : "Evidence in progress"}
              </span>
            </div>
            <section className="academy-objectives" aria-labelledby="academy-objectives-heading">
              <h2 id="academy-objectives-heading">By the end, you can</h2>
              <ul>{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
            </section>
            <section className="academy-objectives" aria-labelledby="academy-prerequisites-heading">
              <h2 id="academy-prerequisites-heading">Prerequisites</h2>
              {lesson.prerequisites.length === 0 ? (
                <p>No earlier lesson is required. New terms are introduced inside this lesson.</p>
              ) : (
                <ul>
                  {lesson.prerequisites.map((prerequisiteId) => {
                    const prerequisiteRoute = routeForLesson(prerequisiteId);
                    return (
                      <li key={prerequisiteId}>
                        {prerequisiteRoute
                          ? <Link to={prerequisiteRoute}>{prerequisiteId}</Link>
                          : prerequisiteId}
                        {progress.academy.lessonRecords[prerequisiteId]?.completionEarned
                          ? " - complete"
                          : " - recommended before continuing"}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </header>

          {actionError && <p className="academy-action-error" role="alert">{actionError}</p>}

          <AcademyLessonV2
            key={lesson.id}
            profile={teachingProfile}
            title={lesson.title}
            embedded
            initialScores={v2InitialScores}
            initialInteractions={v2InitialInteractions}
            attemptHistory={progress.academy.questionAttempts}
            scorePolicy="best"
            beforeAssessment={(
              <>
                {preAssessmentBlocks.map(renderSupplementalBlock)}
              </>
            )}
            onAssessmentEvent={handleV2AssessmentEvent}
            onAssessmentPassed={handleV2AssessmentPassed}
          />

          {postAssessmentBlocks.map(renderSupplementalBlock)}

          <section
            id={retrievalBlockId}
            className="academy-retrieval-prompts"
            aria-labelledby="academy-retrieval-heading"
          >
            <p className="eyebrow">Retrieval for later review</p>
            <h2 id="academy-retrieval-heading">Close the lesson without looking</h2>
            <ol>{lesson.retrievalPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol>
          </section>

          <section
            id={notesBlockId}
            className="academy-lesson-notes"
            aria-labelledby="academy-notes-heading"
          >
            <h2 id="academy-notes-heading">Local lesson notes</h2>
            <p>Record assumptions, questions and evidence references. These notes stay in local progress storage.</p>
            <label htmlFor={`${lesson.id}-NOTES-INPUT`}>Lesson notes</label>
            <textarea
              id={`${lesson.id}-NOTES-INPUT`}
              rows={7}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <button className="btn secondary" type="button" onClick={saveNotes}>Save local notes</button>
          </section>

          <nav className="academy-lesson-pagination" aria-label="Lesson sequence">
            {previousRoute
              ? <Link className="btn secondary" to={previousRoute}>Previous lesson</Link>
              : <span />}
            <Link className="btn secondary" to={academyUnitRoute(course.id, unit.id)}>Return to unit</Link>
            {nextRoute
              ? <Link className="btn" to={nextRoute}>Next lesson</Link>
              : <Link className="btn" to={`/learn/courses/${course.id}/challenge`}>Course challenge</Link>}
          </nav>
        </article>
      </div>
    </section>
  );
}
