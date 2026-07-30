import {
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";
import { Link, useLocation } from "react-router";
import { academySkills } from "../../data/academy/catalogue";
import {
  parseAcademyHandoffContext,
  resolveAcademyHandoffContext,
  type AcademyHandoffContext
} from "../../lib/academy/handoff";
import { planAcademyMasteryEvidence } from "../../lib/academy/masteryIntegration";
import {
  formatAcademyAppliedEvidenceSummary,
  normaliseAcademyAppliedEvidenceReceipt,
  recordAcademyLabEvidence,
  type AcademyAppliedEvidenceReceipt,
  type AcademyUnfinishedLabRecord
} from "../../lib/storage";
import { useProgress } from "../ProgressContext";

function uniqueId(prefix: string): string {
  const random = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${prefix}-${random}`;
}

const emptyEvidenceReceipt: AcademyAppliedEvidenceReceipt = {
  observedResult: "",
  criterionComparison: "",
  evidenceReference: ""
};

function evidenceReceiptIsMeaningful(value: AcademyAppliedEvidenceReceipt): boolean {
  try {
    normaliseAcademyAppliedEvidenceReceipt(value);
    return true;
  } catch {
    return false;
  }
}

export interface AcademyHandoffContextPanelProps {
  context: AcademyHandoffContext;
  unfinished: AcademyUnfinishedLabRecord | null;
  completed: boolean;
  evidence: AcademyAppliedEvidenceReceipt;
  actionError: string;
  actionMessage: string;
  submitting: boolean;
  onEvidenceChange: (
    field: keyof AcademyAppliedEvidenceReceipt,
    value: string
  ) => void;
  onSubmit: () => void;
}

export function AcademyHandoffContextPanel({
  context,
  unfinished,
  completed,
  evidence,
  actionError,
  actionMessage,
  submitting,
  onEvidenceChange,
  onSubmit
}: AcademyHandoffContextPanelProps) {
  const evidenceIsMeaningful = evidenceReceiptIsMeaningful(evidence);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <section
      className="academy-handoff-banner"
      aria-labelledby="academy-handoff-heading"
    >
      <div className="academy-handoff-banner__heading">
        <div>
          <p className="eyebrow">Learner-attested Academy activity</p>
          <h2 id="academy-handoff-heading">Carry the lesson task into this workspace</h2>
        </div>
        <Link className="btn secondary" to={context.academyReturn}>
          Return to lesson
        </Link>
      </div>
      <dl className="academy-handoff-banner__context">
        <div>
          <dt>Lesson and activity block</dt>
          <dd>{context.lessonId} / {context.blockId}</dd>
        </div>
        <div>
          <dt>Exact destination</dt>
          <dd>{context.destinationRoute}</dd>
        </div>
        <div>
          <dt>Task</dt>
          <dd>{context.task}</dd>
        </div>
        <div>
          <dt>Expected outcome</dt>
          <dd>{context.expectedOutcome}</dd>
        </div>
      </dl>
      <p className="academy-handoff-banner__boundary">
        Opening or visiting this workspace records no completion or mastery. Record a specific
        observed result and compare it with the expected outcome before the lesson evidence gate
        can change. These fields are learner-attested local evidence. The app checks their
        structure and exact lesson handoff context, but does not authenticate the claim or
        independently verify the referenced artefact.
      </p>

      {completed ? (
        <p className="inline-message inline-message--success" role="status">
          Learner-attested local applied evidence has already been recorded for this lesson task.
          It is not independently verified proof.
        </p>
      ) : unfinished ? (
        <form className="academy-handoff-banner__evidence" onSubmit={handleSubmit}>
          <label htmlFor="academy-observed-result">
            Observed or tool result
          </label>
          <textarea
            id="academy-observed-result"
            rows={3}
            value={evidence.observedResult}
            onChange={(event) => onEvidenceChange("observedResult", event.target.value)}
            aria-describedby="academy-evidence-receipt-help"
            placeholder="State the input or action and the measured, calculated, simulated or tested result."
          />
          <label htmlFor="academy-criterion-comparison">
            Acceptance-criterion comparison
          </label>
          <textarea
            id="academy-criterion-comparison"
            rows={3}
            value={evidence.criterionComparison}
            onChange={(event) => onEvidenceChange("criterionComparison", event.target.value)}
            aria-describedby="academy-evidence-receipt-help"
            placeholder="Compare the observed result with the expected outcome, including any deviation or failed boundary."
          />
          <label htmlFor="academy-evidence-reference">
            Evidence reference or trace
          </label>
          <input
            id="academy-evidence-reference"
            type="text"
            value={evidence.evidenceReference}
            onChange={(event) => onEvidenceChange("evidenceReference", event.target.value)}
            aria-describedby="academy-evidence-receipt-help"
            placeholder="Saved record, screenshot, file, report or test ID"
          />
          <p id="academy-evidence-receipt-help" className="muted">
            All three fields are required. Result and criterion fields need at least 12 characters
            and three words; the reference must identify retained evidence. Recording them is a
            learner attestation, not authentication or independent verification.
          </p>
          <button
            className="btn primary"
            type="submit"
            disabled={!evidenceIsMeaningful || submitting}
          >
            {submitting
              ? "Recording learner-attested evidence..."
              : "Record learner-attested evidence and satisfy applied task"}
          </button>
        </form>
      ) : (
        <p className="inline-message inline-message--neutral" role="alert">
          No unfinished Academy handoff matches this context. Return to the lesson and open the
          activity again before recording evidence.
        </p>
      )}
      {actionError && (
        <p className="academy-action-error" role="alert">{actionError}</p>
      )}
      {actionMessage && (
        <p className="inline-message inline-message--success" role="status">
          {actionMessage}
        </p>
      )}
    </section>
  );
}

type Resolution =
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "valid"; context: AcademyHandoffContext };

export function AcademyHandoffBanner() {
  const location = useLocation();
  const { progress, replace } = useProgress();
  const parsed = useMemo(
    () => parseAcademyHandoffContext(location.search, location.pathname),
    [location.pathname, location.search]
  );
  const [resolution, setResolution] = useState<Resolution>({ status: "loading" });
  const [evidence, setEvidence] = useState<AcademyAppliedEvidenceReceipt>(
    emptyEvidenceReceipt
  );
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const resolvedBlockId =
    resolution.status === "valid" ? resolution.context.blockId : "";

  useEffect(() => {
    if (parsed.status === "absent") return;
    if (parsed.status === "invalid") {
      setResolution({ status: "invalid", message: parsed.message });
      return;
    }
    let cancelled = false;
    setResolution({ status: "loading" });
    void resolveAcademyHandoffContext(parsed.context)
      .then((context) => {
        if (!cancelled) setResolution({ status: "valid", context });
      })
      .catch((caught) => {
        if (cancelled) return;
        setResolution({
          status: "invalid",
          message: caught instanceof Error
            ? caught.message
            : "Academy activity context could not be validated."
        });
      });
    return () => {
      cancelled = true;
    };
  }, [parsed]);

  useEffect(() => {
    if (resolution.status !== "valid") return;
    setEvidence(emptyEvidenceReceipt);
    setActionError("");
    setActionMessage("");
  }, [resolution.status, resolvedBlockId]);

  if (parsed.status === "absent") return null;
  if (resolution.status === "loading") {
    return (
      <p className="academy-handoff-banner academy-handoff-banner--loading" role="status">
        Validating Academy activity context...
      </p>
    );
  }
  if (resolution.status === "invalid") {
    return (
      <p className="academy-handoff-banner academy-action-error" role="alert">
        Academy activity context was ignored: {resolution.message}
      </p>
    );
  }

  const { context } = resolution;
  const unfinished = progress.academy.unfinishedLabs[context.labId] ?? null;
  const completed =
    progress.academy.lessonRecords[context.lessonId]
      ?.requirements.appliedEvidenceSatisfied === true;

  const submitEvidence = () => {
    setActionError("");
    setActionMessage("");
    setSubmitting(true);
    try {
      const evidenceReceipt = normaliseAcademyAppliedEvidenceReceipt(evidence);
      const evidenceSummary = formatAcademyAppliedEvidenceSummary(evidenceReceipt);
      const timestamp = new Date().toISOString();
      const relevantSkills = academySkills.filter(
        (skill) => skill.lessonIds.includes(context.lessonId)
      );
      if (relevantSkills.length === 0) {
        throw new Error("No Academy skill mapping resolves for this lesson.");
      }
      const skillEvidencePlans = relevantSkills.map((skill) =>
        planAcademyMasteryEvidence(
          progress.academy,
          skill,
          {
            evidenceId: uniqueId("EV"),
            kind: "applied-evidence",
            referenceId: context.blockId,
            summary: evidenceSummary,
            recordedAt: timestamp,
            passed: true
          },
          timestamp
        )
      );
      replace(recordAcademyLabEvidence(progress, {
        courseId: context.courseId,
        unitId: context.unitId,
        lessonId: context.lessonId,
        labId: context.labId,
        blockId: context.blockId,
        evidence: evidenceReceipt,
        skillEvidencePlans,
        timestamp
      }));
      setEvidence(emptyEvidenceReceipt);
      setActionMessage(
        "Learner-attested local evidence recorded. This is not independently verified proof. The unfinished handoff is cleared and the lesson gate is satisfied."
      );
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Applied evidence could not be recorded."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AcademyHandoffContextPanel
      context={context}
      unfinished={unfinished}
      completed={completed}
      evidence={evidence}
      actionError={actionError}
      actionMessage={actionMessage}
      submitting={submitting}
      onEvidenceChange={(field, value) =>
        setEvidence((current) => ({ ...current, [field]: value }))
      }
      onSubmit={submitEvidence}
    />
  );
}
