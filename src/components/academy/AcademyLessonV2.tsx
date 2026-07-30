import type { ReactNode } from "react";
import type {
  AcademyDomainCondition,
  AcademyLessonTeachingProfileV2,
  AcademyReasonedCase
} from "../../data/academy/lessonTeachingProfileV2";
import type {
  AcademyLessonV2AttemptHistory,
  AcademyLessonV2AssessmentEvent,
  AcademyLessonV2InitialQuestionInteractions,
  AcademyLessonV2AssessmentProgress,
  AcademyLessonV2QuestionKey
} from "./AcademyLessonV2Assessment";
import { AcademyLessonV2AssessmentSuite } from "./AcademyLessonV2Assessment";
import { AcademyLessonV2Explorer } from "./AcademyLessonV2Explorer";

export type AcademyLessonV2SectionKey =
  | "overview"
  | "terms"
  | "conceptual-model"
  | "reasoned-cases"
  | "failure-boundary"
  | "misconception"
  | "explorer"
  | "assessment";

export interface AcademyLessonV2OutlineItem {
  key: AcademyLessonV2SectionKey;
  id: string;
  resumeBlockId: string;
  title: string;
}

export interface AcademyLessonV2Props {
  profile: AcademyLessonTeachingProfileV2;
  title?: string;
  requiredScorePercent?: number;
  initialScores?: Readonly<Partial<Record<AcademyLessonV2QuestionKey, number>>>;
  initialInteractions?: AcademyLessonV2InitialQuestionInteractions;
  attemptHistory?: AcademyLessonV2AttemptHistory;
  beforeAssessment?: ReactNode;
  embedded?: boolean;
  scorePolicy?: "latest" | "best";
  onAssessmentEvent?: (event: AcademyLessonV2AssessmentEvent) => void;
  onAssessmentProgress?: (progress: AcademyLessonV2AssessmentProgress) => void;
  onAssessmentPassed?: (progress: AcademyLessonV2AssessmentProgress) => void;
}

const SECTION_DEFINITIONS: readonly {
  key: AcademyLessonV2SectionKey;
  title: string;
}[] = [
  { key: "overview", title: "Start with the whole system" },
  { key: "terms", title: "Terms and operating conditions" },
  { key: "conceptual-model", title: "Build the conceptual model" },
  { key: "reasoned-cases", title: "Reason through contrasting cases" },
  { key: "failure-boundary", title: "Locate the failure boundary" },
  { key: "misconception", title: "Correct the tempting misconception" },
  { key: "explorer", title: "Explore the model" },
  { key: "assessment", title: "Practise and demonstrate mastery" }
];

const normaliseIdPart = (value: string): string =>
  value.trim().replace(/[^A-Za-z0-9_.:-]+/gu, "-");

export const academyLessonV2SectionId = (
  lessonId: string,
  key: AcademyLessonV2SectionKey
): string =>
  `${normaliseIdPart(lessonId)}-V2-${key.toLocaleUpperCase("en-AU")}`;

export const buildAcademyLessonV2Outline = (
  profile: AcademyLessonTeachingProfileV2
): AcademyLessonV2OutlineItem[] =>
  SECTION_DEFINITIONS.map(({ key, title }) => {
    const id = academyLessonV2SectionId(profile.lessonId, key);
    return {
      key,
      id,
      resumeBlockId: id,
      title
    };
  });

const conditionLabel = (
  conditions: readonly AcademyDomainCondition[],
  conditionId: string
): string =>
  conditions.find((condition) => condition.conditionId === conditionId)
    ?.statement ?? conditionId;

function ReasonedCase({
  reasonedCase,
  conditions
}: {
  reasonedCase: AcademyReasonedCase;
  conditions: readonly AcademyDomainCondition[];
}) {
  const headingId = `${normaliseIdPart(reasonedCase.id)}-HEADING`;
  return (
    <article
      className={`academy-v2-case academy-v2-case--${reasonedCase.kind}`}
      aria-labelledby={headingId}
    >
      <header>
        <p className="eyebrow">
          {reasonedCase.kind === "example"
            ? "Worked example"
            : "Counterexample"}
        </p>
        <h3 id={headingId}>{reasonedCase.scenario}</h3>
      </header>
      {reasonedCase.changedConditionIds.length > 0 && (
        <div className="academy-v2-case__changed">
          <h4>Condition changed for this case</h4>
          <ul>
            {reasonedCase.changedConditionIds.map((conditionId) => (
              <li key={conditionId}>
                {conditionLabel(conditions, conditionId)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="academy-v2-case__givens">
        <h4>Givens</h4>
        <dl>
          {reasonedCase.givens.map((given) => (
            <div key={given.givenId}>
              <dt>{given.label}</dt>
              <dd>
                {given.value}
                {given.unit ? ` ${given.unit}` : ""}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="academy-v2-case__reasoning">
        <h4>Reasoning, one step at a time</h4>
        <ol>
          {reasonedCase.reasoningSteps.map((step) => (
            <li key={step.stepId}>{step.statement}</li>
          ))}
        </ol>
      </div>
      <dl className="academy-v2-case__receipt">
        <div>
          <dt>Outcome</dt>
          <dd>{reasonedCase.outcome}</dd>
        </div>
        <div>
          <dt>Decision criterion</dt>
          <dd>{reasonedCase.criterion}</dd>
        </div>
        <div>
          <dt>Independent check</dt>
          <dd>{reasonedCase.verification}</dd>
        </div>
      </dl>
    </article>
  );
}

export function AcademyLessonV2({
  profile,
  title = "Complete native lesson",
  requiredScorePercent = 80,
  initialScores,
  initialInteractions,
  attemptHistory,
  beforeAssessment,
  embedded = false,
  scorePolicy,
  onAssessmentEvent,
  onAssessmentProgress,
  onAssessmentPassed
}: AcademyLessonV2Props) {
  const outline = buildAcademyLessonV2Outline(profile);
  const section = (key: AcademyLessonV2SectionKey) => {
    const item = outline.find((candidate) => candidate.key === key);
    if (!item) {
      throw new Error(`Missing V2 lesson section descriptor for "${key}".`);
    }
    return item;
  };
  const overview = section("overview");
  const terms = section("terms");
  const conceptualModel = section("conceptual-model");
  const reasonedCases = section("reasoned-cases");
  const failureBoundary = section("failure-boundary");
  const misconception = section("misconception");
  const explorer = section("explorer");
  const assessment = section("assessment");
  const entityById = new Map(
    profile.entities.map((entity) => [entity.entityId, entity])
  );

  return (
    <article
      className="academy-v2"
      data-academy-lesson-id={profile.lessonId}
      data-academy-profile-version={profile.schemaVersion}
    >
      {!embedded && (
        <>
          <header className="academy-v2__hero">
            <p className="eyebrow">Self-contained beginner lesson</p>
            <h1>{title}</h1>
            <p>
              This lesson teaches the model inside the app, then asks you to
              reason with it. External material is supplementary and is never
              required to understand or complete this lesson.
            </p>
          </header>

          <nav className="academy-v2-outline" aria-label="V2 lesson outline">
            <h2>Lesson outline</h2>
            <ol>
              {outline.map((item) => (
                <li key={item.key}>
                  <a href={`#${item.id}`}>{item.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        </>
      )}
      {embedded && (
        <p className="academy-v2__embedded-note">
          <strong>Complete native lesson.</strong>{" "}
          Learn and practise the full model here. Any external material is
          supplementary and is not required for completion.
        </p>
      )}

      <section
        id={overview.id}
        className="academy-v2-section academy-v2-overview"
        aria-labelledby={`${overview.id}-heading`}
        data-academy-resume-block={overview.resumeBlockId}
      >
        <header>
          <p className="eyebrow">First principles</p>
          <h2 id={`${overview.id}-heading`}>{overview.title}</h2>
        </header>
        <div className="academy-v2-overview__grid">
          <article>
            <h3>System model</h3>
            <p>{profile.systemModel}</p>
          </article>
          <article>
            <h3>What you will see</h3>
            <p>{profile.visualExplanation}</p>
          </article>
          <article>
            <h3>Failure pattern to watch</h3>
            <p>{profile.failurePattern}</p>
          </article>
        </div>
        <aside className="academy-v2-application">
          <h3>Your application task</h3>
          <p>{profile.applicationTask}</p>
        </aside>
      </section>

      <section
        id={terms.id}
        className="academy-v2-section academy-v2-terms"
        aria-labelledby={`${terms.id}-heading`}
        data-academy-resume-block={terms.resumeBlockId}
      >
        <header>
          <p className="eyebrow">Beginner vocabulary</p>
          <h2 id={`${terms.id}-heading`}>{terms.title}</h2>
          <p>
            Each definition states what the term means and where that meaning
            stops. The boundary prevents a familiar word from being used too
            broadly.
          </p>
        </header>
        <dl className="academy-v2-terms__list">
          {profile.terms.map((term) => (
            <div key={term.termId}>
              <dt>{term.label}</dt>
              <dd>
                <p>{term.definition}</p>
                <p>
                  <strong>Boundary:</strong> {term.boundary}
                </p>
              </dd>
            </div>
          ))}
        </dl>
        <div className="academy-v2-conditions">
          <h3>Conditions that govern the model</h3>
          <ul>
            {profile.conditions.map((condition) => (
              <li key={condition.conditionId}>
                <strong>
                  {condition.conditionType.replaceAll("-", " ")}:
                </strong>{" "}
                {condition.statement}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id={conceptualModel.id}
        className="academy-v2-section academy-v2-conceptual"
        aria-labelledby={`${conceptualModel.id}-heading`}
        data-academy-resume-block={conceptualModel.resumeBlockId}
      >
        <header>
          <p className="eyebrow">Conceptual walkthrough</p>
          <h2 id={`${conceptualModel.id}-heading`}>
            {conceptualModel.title}
          </h2>
          <p>
            Follow the mechanism in order. The named entities underneath each
            step show which parts of the system the statement is about.
          </p>
        </header>
        <ol className="academy-v2-conceptual__steps">
          {profile.conceptualModel.map((step) => (
            <li key={step.stepId}>
              <p>{step.statement}</p>
              <dl>
                <div>
                  <dt>System parts</dt>
                  <dd>
                    {step.entityIds
                      .map(
                        (entityId) =>
                          entityById.get(entityId)?.label ?? entityId
                      )
                      .join(", ")}
                  </dd>
                </div>
                {step.conditionIds.length > 0 && (
                  <div>
                    <dt>Conditions in force</dt>
                    <dd>
                      {step.conditionIds
                        .map((conditionId) =>
                          conditionLabel(profile.conditions, conditionId)
                        )
                        .join(" ")}
                    </dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section
        id={reasonedCases.id}
        className="academy-v2-section academy-v2-cases"
        aria-labelledby={`${reasonedCases.id}-heading`}
        data-academy-resume-block={reasonedCases.resumeBlockId}
      >
        <header>
          <p className="eyebrow">Worked reasoning</p>
          <h2 id={`${reasonedCases.id}-heading`}>{reasonedCases.title}</h2>
          <p>
            Compare a case where the model holds with a counterexample where a
            changed condition crosses its boundary.
          </p>
        </header>
        <div className="academy-v2-cases__grid">
          {profile.reasonedCases.map((reasonedCase) => (
            <ReasonedCase
              key={reasonedCase.id}
              reasonedCase={reasonedCase}
              conditions={profile.conditions}
            />
          ))}
        </div>
      </section>

      <section
        id={failureBoundary.id}
        className="academy-v2-section academy-v2-failure"
        aria-labelledby={`${failureBoundary.id}-heading`}
        data-academy-resume-block={failureBoundary.resumeBlockId}
      >
        <header>
          <p className="eyebrow">Failure reasoning</p>
          <h2 id={`${failureBoundary.id}-heading`}>
            {failureBoundary.title}
          </h2>
        </header>
        <p>
          <strong>Boundary condition:</strong>{" "}
          {conditionLabel(
            profile.conditions,
            profile.failureBoundary.conditionId
          )}
        </p>
        <dl>
          <div>
            <dt>Mechanism</dt>
            <dd>{profile.failureBoundary.mechanism}</dd>
          </div>
          <div>
            <dt>Observable consequence</dt>
            <dd>{profile.failureBoundary.observableConsequence}</dd>
          </div>
          <div>
            <dt>Decision criterion</dt>
            <dd>{profile.failureBoundary.criterion}</dd>
          </div>
        </dl>
      </section>

      <section
        id={misconception.id}
        className="academy-v2-section academy-v2-misconception"
        aria-labelledby={`${misconception.id}-heading`}
        data-academy-resume-block={misconception.resumeBlockId}
      >
        <header>
          <p className="eyebrow">Misconception clinic</p>
          <h2 id={`${misconception.id}-heading`}>
            {misconception.title}
          </h2>
        </header>
        <blockquote>{profile.misconception.claim}</blockquote>
        <dl>
          <div>
            <dt>Why that claim can feel plausible</dt>
            <dd>{profile.misconception.mechanism}</dd>
          </div>
          <div>
            <dt>Correction</dt>
            <dd>{profile.misconception.correction}</dd>
          </div>
          <div>
            <dt>Observation that disproves it</dt>
            <dd>{profile.misconception.disconfirmingObservation}</dd>
          </div>
        </dl>
      </section>

      <AcademyLessonV2Explorer
        explorer={profile.explorer}
        entities={profile.entities}
        relations={profile.relations}
        conditions={profile.conditions}
        sectionId={explorer.id}
        resumeBlockId={explorer.resumeBlockId}
      />

      {beforeAssessment}

      <AcademyLessonV2AssessmentSuite
        profile={profile}
        sectionId={assessment.id}
        resumeBlockId={assessment.resumeBlockId}
        requiredScorePercent={requiredScorePercent}
        initialScores={initialScores}
        initialInteractions={initialInteractions}
        attemptHistory={attemptHistory}
        scorePolicy={scorePolicy}
        onAssessmentEvent={onAssessmentEvent}
        onAssessmentProgress={onAssessmentProgress}
        onAssessmentPassed={onAssessmentPassed}
      />
    </article>
  );
}
