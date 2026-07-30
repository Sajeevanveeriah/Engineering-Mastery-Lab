import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loadProgressWithStatus,
  recordAcademyAssessmentAttempt,
  recordAcademyQuestionAttempt,
  recordAcademyRecommendationReceipt,
  recordAcademySkillEvidence,
  saveProgress,
  setAcademyLessonBookmarked,
  setAcademyLessonNotes,
  setAcademyResumeCursor,
  setAcademyReviewState,
  startAcademyLesson,
  updateAcademyLesson,
  updateAcademyQuestionInteraction,
  validateProgressState,
  type AcademyAssessmentAttempt,
  type AcademyQuestionAttemptRecord,
  type AcademyRecommendationReceipt,
  type AcademyReviewState,
  type ProgressState,
  type RecordAcademySkillEvidenceInput,
  type SetAcademyLessonBookmarkInput,
  type SetAcademyLessonNotesInput,
  type SetAcademyResumeCursorInput,
  type StartAcademyLessonInput,
  type Theme,
  type UpdateAcademyQuestionInteractionInput,
  type UpdateAcademyLessonInput
} from "../lib/storage";
import { applyTheme, resolveTheme } from "../lib/theme";

interface ProgressApi {
  progress: ProgressState;
  update: (fn: (p: ProgressState) => ProgressState) => void;
  replace: (p: ProgressState) => void;
  replaceAndResolveRecovery: (p: ProgressState) => boolean;
  startLesson: (input: StartAcademyLessonInput) => void;
  updateLesson: (input: UpdateAcademyLessonInput) => void;
  recordAssessmentAttempt: (input: AcademyAssessmentAttempt) => void;
  recordQuestionAttempt: (input: AcademyQuestionAttemptRecord) => void;
  updateQuestionInteraction: (input: UpdateAcademyQuestionInteractionInput) => void;
  recordRecommendationReceipt: (input: AcademyRecommendationReceipt) => void;
  recordSkillEvidence: (input: RecordAcademySkillEvidenceInput) => void;
  setResumeCursor: (input: SetAcademyResumeCursorInput | null) => void;
  setLessonNotes: (input: SetAcademyLessonNotesInput) => void;
  setLessonBookmarked: (input: SetAcademyLessonBookmarkInput) => void;
  setReviewState: (input: AcademyReviewState) => void;
  persistenceAvailable: boolean;
  progressRecoveryRequired: boolean;
  progressRecoveryBytes: string | null;
  resolvedTheme: Theme;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [initialLoad] = useState(loadProgressWithStatus);
  const [progress, setProgress] = useState<ProgressState>(initialLoad.progress);
  const [progressRecoveryRequired, setProgressRecoveryRequired] = useState(
    initialLoad.recoveryRequired
  );
  const [progressRecoveryBytes, setProgressRecoveryBytes] = useState(
    initialLoad.invalidCurrentBytes
  );
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    !initialLoad.recoveryRequired
  );
  const [systemDark, setSystemDark] = useState(() =>
    typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (progressRecoveryRequired) {
      setPersistenceAvailable(false);
      return;
    }
    setPersistenceAvailable(saveProgress(progress));
  }, [progress, progressRecoveryRequired]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    if (progress.themePreference !== "system") return;
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [progress.themePreference]);

  useEffect(() => {
    applyTheme(progress.themePreference, systemDark);
  }, [progress.themePreference, systemDark]);

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((current) => validateProgressState(fn(structuredClone(current))));
  }, []);
  const replace = useCallback((next: ProgressState) => {
    setProgress(validateProgressState(structuredClone(next)));
  }, []);
  const replaceAndResolveRecovery = useCallback((next: ProgressState): boolean => {
    const validated = validateProgressState(structuredClone(next));
    const saved = saveProgress(validated);
    setPersistenceAvailable(saved);
    if (!saved) return false;
    setProgress(validated);
    setProgressRecoveryRequired(false);
    setProgressRecoveryBytes(null);
    return true;
  }, []);
  const startLesson = useCallback((input: StartAcademyLessonInput) => {
    setProgress((current) => startAcademyLesson(current, input));
  }, []);
  const updateLesson = useCallback((input: UpdateAcademyLessonInput) => {
    setProgress((current) => updateAcademyLesson(current, input));
  }, []);
  const recordAssessmentAttempt = useCallback((input: AcademyAssessmentAttempt) => {
    setProgress((current) => recordAcademyAssessmentAttempt(current, input));
  }, []);
  const recordQuestionAttempt = useCallback((input: AcademyQuestionAttemptRecord) => {
    setProgress((current) => recordAcademyQuestionAttempt(current, input));
  }, []);
  const updateQuestionInteraction = useCallback((
    input: UpdateAcademyQuestionInteractionInput
  ) => {
    setProgress((current) => updateAcademyQuestionInteraction(current, input));
  }, []);
  const recordRecommendationReceipt = useCallback((input: AcademyRecommendationReceipt) => {
    setProgress((current) => recordAcademyRecommendationReceipt(current, input));
  }, []);
  const recordSkillEvidence = useCallback((input: RecordAcademySkillEvidenceInput) => {
    setProgress((current) => recordAcademySkillEvidence(current, input));
  }, []);
  const setResumeCursor = useCallback((input: SetAcademyResumeCursorInput | null) => {
    setProgress((current) => setAcademyResumeCursor(current, input));
  }, []);
  const setLessonNotes = useCallback((input: SetAcademyLessonNotesInput) => {
    setProgress((current) => setAcademyLessonNotes(current, input));
  }, []);
  const setLessonBookmarked = useCallback((input: SetAcademyLessonBookmarkInput) => {
    setProgress((current) => setAcademyLessonBookmarked(current, input));
  }, []);
  const setReviewState = useCallback((input: AcademyReviewState) => {
    setProgress((current) => setAcademyReviewState(current, input));
  }, []);
  const resolvedTheme = resolveTheme(progress.themePreference, systemDark);
  const api = useMemo<ProgressApi>(() => ({
    progress,
    update,
    replace,
    replaceAndResolveRecovery,
    startLesson,
    updateLesson,
    recordAssessmentAttempt,
    recordQuestionAttempt,
    updateQuestionInteraction,
    recordRecommendationReceipt,
    recordSkillEvidence,
    setResumeCursor,
    setLessonNotes,
    setLessonBookmarked,
    setReviewState,
    persistenceAvailable,
    progressRecoveryRequired,
    progressRecoveryBytes,
    resolvedTheme
  }), [
    persistenceAvailable,
    progress,
    progressRecoveryBytes,
    progressRecoveryRequired,
    recordAssessmentAttempt,
    recordQuestionAttempt,
    recordRecommendationReceipt,
    recordSkillEvidence,
    replace,
    replaceAndResolveRecovery,
    resolvedTheme,
    setLessonBookmarked,
    setLessonNotes,
    setResumeCursor,
    setReviewState,
    startLesson,
    update,
    updateLesson,
    updateQuestionInteraction
  ]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
