import type { MediaSpec } from "../lib/academy/types";
import {
  academyMediaPlacements,
  generatedAcademyMediaRegistry,
  type AcademyMediaPlacement
} from "./academyMedia.generated";

export { academyMediaPlacements };
export type { AcademyMediaPlacement };

const VALIDATED_ON = "2026-07-31";
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const YOUTUBE_PRIVACY_ORIGIN = "https://www.youtube-nocookie.com";

export interface PrivacyEmbedOptions {
  origin?: string | null;
  resumeSeconds?: number | null;
  endSeconds?: number | null;
}

function normaliseProviderMetadata(value: unknown): string {
  return typeof value === "string"
    ? value
      .trim()
      .replace(/[\u2013\u2014]/gu, "-")
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("en")
    : "";
}

export function validateAcademyMediaProviderMetadata(
  media: MediaSpec,
  current: {
    title: unknown;
    author: unknown;
  }
): {
  titleMatches: boolean;
  authorMatches: boolean;
} {
  const registryTitle = normaliseProviderMetadata(media.title);
  const currentTitle = normaliseProviderMetadata(current.title);
  const registryCreator = normaliseProviderMetadata(media.creator);
  const currentAuthor = normaliseProviderMetadata(current.author);
  return {
    titleMatches: currentTitle !== "" && currentTitle === registryTitle,
    authorMatches: currentAuthor !== ""
      && (
        registryCreator === currentAuthor
        || registryCreator.startsWith(`${currentAuthor} and `)
      )
  };
}

export const academyLegacyMediaRegistry = [
  {
    id: "mit-calculus-course-introduction",
    provider: "youtube",
    creator: "MIT OpenCourseWare and Prof. Herbert Gross",
    title: "Preface | MIT Calculus Revisited: Single Variable Calculus",
    kind: "video",
    originalUrl: "https://www.youtube.com/watch?v=MFRWDuduuSw",
    providerId: "MFRWDuduuSw",
    durationMinutes: 32.1,
    startSeconds: null,
    endSeconds: null,
    learningOutcome: "Recognise calculus as a connected way to reason about change, rather than a list of isolated rules.",
    poster: null,
    captionsStatus: "available",
    nativeSummaryFallback:
      "The course introduction frames calculus as reasoning about relationships and change. In this academy, the written lesson below supplies the definitions, derivations, examples and practice. The video is optional context from MIT OpenCourseWare.",
    chapters: [
      "Why calculus is useful",
      "How the course is organised",
      "How explanation and practice work together"
    ],
    licence: "CC BY-NC-SA 4.0",
    attribution:
      "MIT OpenCourseWare, Calculus Revisited: Single Variable Calculus, Prof. Herbert Gross. Validate current asset terms at the linked source before reuse.",
    embedPermission: "permitted",
    lastValidated: VALIDATED_ON,
    privacyBehaviour:
      "The player is not created until the learner selects Load optional video. It uses youtube-nocookie.com, does not request autoplay and can be unloaded.",
    offlineFallback:
      "Continue with the complete native lesson, worked examples and practice. The video is never required for assessment.",
    alternativeSourceId: "SRC-MIT-OCW-CALCULUS-REVISITED"
  },
  {
    id: "mit-calculus-chain-rule",
    provider: "youtube",
    creator: "MIT OpenCourseWare and Prof. Herbert Gross",
    title: "Unit II: Lec 3 | MIT Calculus Revisited: Single Variable Calculus",
    kind: "video",
    originalUrl: "https://www.youtube.com/watch?v=w_JWcGLiifU",
    providerId: "w_JWcGLiifU",
    durationMinutes: 39.25,
    startSeconds: null,
    endSeconds: null,
    learningOutcome: "Connect composite functions with the chain rule and explain why the derivative factors multiply.",
    poster: null,
    captionsStatus: "available",
    nativeSummaryFallback:
      "A composite function feeds the output of one function into another. Its derivative combines the outer rate of change with the inner rate of change. The native derivation and examples in this lesson are the authoritative learning path.",
    chapters: [
      "Composite functions",
      "Variables related in a chain",
      "Reasoning behind the chain rule"
    ],
    licence: "CC BY-NC-SA 4.0",
    attribution:
      "MIT OpenCourseWare, Calculus Revisited: Single Variable Calculus, Part II, Lecture 3, Prof. Herbert Gross.",
    embedPermission: "permitted",
    lastValidated: VALIDATED_ON,
    privacyBehaviour:
      "The player is not created until the learner selects Load optional video. It uses youtube-nocookie.com, does not request autoplay and can be unloaded.",
    offlineFallback:
      "Use the native chain-rule derivation, worked calculation and guided practice supplied in this lesson.",
    alternativeSourceId: "SRC-MIT-OCW-CALCULUS-REVISITED"
  },
  {
    id: "mit-calculus-inverse-differentiation",
    provider: "youtube",
    creator: "MIT OpenCourseWare and Prof. Herbert Gross",
    title: "Unit II: Lec 10 | MIT Calculus Revisited: Single Variable Calculus",
    kind: "video",
    originalUrl: "https://www.youtube.com/watch?v=-S5GwNe0xXg",
    providerId: "-S5GwNe0xXg",
    durationMinutes: 42.98,
    startSeconds: null,
    endSeconds: null,
    learningOutcome: "Interpret antiderivatives as inverse differentiation and account for the family of possible constants.",
    poster: null,
    captionsStatus: "available",
    nativeSummaryFallback:
      "Inverse differentiation asks which family of functions has a stated derivative. Differentiating removes an additive constant, so an indefinite integral must retain an arbitrary constant. Native instruction and practice remain complete without loading the video.",
    chapters: [
      "Derivative and inverse operation",
      "Antiderivative families",
      "Why the integration constant matters"
    ],
    licence: "CC BY-NC-SA 4.0",
    attribution:
      "MIT OpenCourseWare, Calculus Revisited: Single Variable Calculus, Part II, Lecture 10, Prof. Herbert Gross.",
    embedPermission: "permitted",
    lastValidated: VALIDATED_ON,
    privacyBehaviour:
      "The player is not created until the learner selects Load optional video. It uses youtube-nocookie.com, does not request autoplay and can be unloaded.",
    offlineFallback:
      "Use the native inverse-differentiation explanation, worked example and retrieval prompts in this lesson.",
    alternativeSourceId: "SRC-MIT-OCW-CALCULUS-REVISITED"
  },
  {
    id: "mit-circuits-basic-analysis",
    provider: "youtube",
    creator: "MIT OpenCourseWare and Prof. Anant Agarwal",
    title: "Lec 2 | MIT 6.002 Circuits and Electronics, Spring 2007",
    kind: "video",
    originalUrl: "https://www.youtube.com/watch?v=2vHGYdepKLw",
    providerId: "2vHGYdepKLw",
    durationMinutes: 49.17,
    startSeconds: null,
    endSeconds: null,
    learningOutcome: "Relate Kirchhoff's current and voltage laws to node-voltage and loop analysis.",
    poster: null,
    captionsStatus: "available",
    nativeSummaryFallback:
      "Circuit analysis assigns reference directions, writes current and voltage constraints, and solves the resulting equations without changing sign conventions midstream. The academy lesson provides a complete native derivation, numerical example and practice set.",
    chapters: [
      "Reference directions and circuit variables",
      "Kirchhoff's current and voltage laws",
      "Node-voltage and loop equations"
    ],
    licence: "CC BY-NC-SA 4.0",
    attribution:
      "MIT OpenCourseWare, 6.002 Circuits and Electronics, Spring 2007, Lecture 2, Prof. Anant Agarwal.",
    embedPermission: "permitted",
    lastValidated: VALIDATED_ON,
    privacyBehaviour:
      "The player is not created until the learner selects Load optional video. It uses youtube-nocookie.com, does not request autoplay and can be unloaded.",
    offlineFallback:
      "Continue through the native Kirchhoff-law explanation, circuit example and checked practice in this lesson.",
    alternativeSourceId: "SRC-MIT-OCW-CIRCUITS-6002"
  }
] as const satisfies readonly MediaSpec[];

const academyAlternativeSourceByUnitId: Readonly<Record<string, string>> = {
  "EML-E0-D01": "SRC-OPENSTAX-STUDY",
  "EML-E0-D02": "SRC-NIST-TN-1297",
  "EML-E0-D03": "SRC-OPENSTAX-PRECALCULUS-2E",
  "EML-E1-D04": "SRC-MIT-OCW-CALCULUS-REVISITED",
  "EML-E1-D05": "SRC-OPENSTAX-UNIVERSITY-PHYSICS-1",
  "EML-E1-D06": "SRC-MIT-MISSING-SEMESTER",
  "EML-E1-D07": "SRC-MIT-6-100L",
  "EML-E1-D08": "SRC-AUTODESK-FUSION-CAD-90",
  "EML-E2-D09": "SRC-MIT-2-001",
  "EML-E2-D10": "SRC-MIT-2-008",
  "EML-E2-D11": "SRC-MIT-OCW-CIRCUITS-6002",
  "EML-E2-D12": "SRC-MIT-2-737",
  "EML-E2-D13": "SRC-ARM-CMSIS-DRIVER",
  "EML-E2-D14": "SRC-OASIS-MQTT-5",
  "EML-E2-D15": "SRC-MIT-6-003",
  "EML-E2-D16": "SRC-MIT-2-14",
  "EML-E3-D17": "SRC-MIT-2-12",
  "EML-E3-D18": "SRC-ROS2-JAZZY-CLI",
  "EML-E3-D19": "SRC-MIT-6-041SC",
  "EML-E3-D20": "SRC-NAV2-CONCEPTS",
  "EML-E3-D21": "SRC-OPENCV-5-TUTORIALS",
  "EML-E3-D22": "SRC-SCIKIT-USER-GUIDE",
  "EML-E3-D23": "SRC-PYTORCH-BASICS",
  "EML-E4-D24": "SRC-NASA-SE-HANDBOOK",
  "EML-E4-D25": "SRC-ENGINEERS-AUSTRALIA-STAGE-1"
};

const firstPlacementByMediaId = new Map<string, AcademyMediaPlacement>();
for (const placement of academyMediaPlacements) {
  if (!firstPlacementByMediaId.has(placement.mediaId)) {
    firstPlacementByMediaId.set(placement.mediaId, placement);
  }
}

function normaliseVisibleProviderText(value: string): string {
  return value.replace(/[\u2013\u2014]/gu, "-");
}

export const academyMediaRegistry: readonly MediaSpec[] =
  generatedAcademyMediaRegistry.map((media) => {
    const placement = firstPlacementByMediaId.get(media.id);
    const unitId = placement?.lessonId.slice(0, "EML-E0-D01".length);
    const alternativeSourceId = unitId
      ? academyAlternativeSourceByUnitId[unitId] ?? null
      : null;
    return {
      ...media,
      title: normaliseVisibleProviderText(media.title),
      attribution: normaliseVisibleProviderText(media.attribution),
      alternativeSourceId
    };
  });

export const academyMediaById: ReadonlyMap<string, MediaSpec> = new Map(
  [...academyLegacyMediaRegistry, ...academyMediaRegistry]
    .map((media) => [media.id, media])
);

export const academyMediaPlacementByLessonId: ReadonlyMap<
  string,
  AcademyMediaPlacement
> = new Map(
  academyMediaPlacements.map((placement) => [placement.lessonId, placement])
);

export const academyMediaByLessonId: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(
    academyMediaPlacements.map((placement) => [
      placement.lessonId,
      [placement.mediaId]
    ])
  );

export interface AcademyMediaGap {
  lessonId: string;
  status: "MEDIA_GAP";
  reason: string;
  requiredAcceptanceTest: string;
}

const mappedLessonIds = new Set(Object.keys(academyMediaByLessonId));
const academyUnitRanges = [
  ["E0", 1, 3],
  ["E1", 4, 8],
  ["E2", 9, 16],
  ["E3", 17, 23],
  ["E4", 24, 25]
] as const;
const requiredAcademyLessonIds = academyUnitRanges.flatMap(
  ([stage, firstUnit, lastUnit]) =>
    Array.from({ length: lastUnit - firstUnit + 1 }, (_, unitOffset) => (
      `EML-${stage}-D${String(firstUnit + unitOffset).padStart(2, "0")}`
    )).flatMap((unitId) =>
      Array.from(
        { length: 7 },
        (_, lessonOffset) =>
          `${unitId}-L${String(lessonOffset + 1).padStart(2, "0")}`
      )
    )
);

export const academyMediaGaps: readonly AcademyMediaGap[] = requiredAcademyLessonIds
  .filter((lessonId) => !mappedLessonIds.has(lessonId))
  .map((lessonId) => ({
    lessonId,
    status: "MEDIA_GAP" as const,
    reason:
      "No directly relevant, high-quality embedded instructional video has been reviewed and validated for this lesson.",
    requiredAcceptanceTest:
      "Add a reviewed mapping, pass metadata and embed validation, then prove the in-lesson player and written fallback in a browser."
  }));

export const academyMediaGapByLessonId: ReadonlyMap<string, AcademyMediaGap> =
  new Map(academyMediaGaps.map((gap) => [gap.lessonId, gap]));

export function getAcademyMedia(mediaId: string): MediaSpec | null {
  return academyMediaById.get(mediaId) ?? null;
}

export function buildPrivacyEmbedUrl(
  media: MediaSpec,
  options: PrivacyEmbedOptions = {}
): string | null {
  if (
    media.provider !== "youtube"
    || media.embedPermission !== "permitted"
    || !media.providerId
    || !YOUTUBE_ID_PATTERN.test(media.providerId)
  ) {
    return null;
  }

  const embedUrl = new URL(`${YOUTUBE_PRIVACY_ORIGIN}/embed/${media.providerId}`);
  embedUrl.searchParams.set("cc_lang_pref", "en");
  embedUrl.searchParams.set("cc_load_policy", "1");
  embedUrl.searchParams.set("playsinline", "1");
  embedUrl.searchParams.set("rel", "0");
  embedUrl.searchParams.set("enablejsapi", "1");
  if (options.origin) {
    try {
      const origin = new URL(options.origin);
      if (
        (origin.protocol === "http:" || origin.protocol === "https:")
        && origin.origin === options.origin
      ) {
        embedUrl.searchParams.set("origin", origin.origin);
      }
    } catch {
      // An invalid caller origin is omitted rather than forwarded.
    }
  }
  const requestedStart = Number.isFinite(options.resumeSeconds)
    ? Math.max(media.startSeconds ?? 0, options.resumeSeconds ?? 0)
    : media.startSeconds;
  if (requestedStart !== null && requestedStart > 0) {
    embedUrl.searchParams.set("start", String(Math.floor(requestedStart)));
  }
  const requestedEnd = options.endSeconds === undefined
    ? media.endSeconds
    : options.endSeconds;
  if (requestedEnd !== null && requestedEnd > 0) {
    embedUrl.searchParams.set("end", String(Math.floor(requestedEnd)));
  }
  return embedUrl.toString();
}
