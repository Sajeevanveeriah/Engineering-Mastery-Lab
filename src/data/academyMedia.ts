import type { MediaSpec } from "../lib/academy/types";

const VALIDATED_ON = "2026-07-30";
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const YOUTUBE_PRIVACY_ORIGIN = "https://www.youtube-nocookie.com";

export interface PrivacyEmbedOptions {
  origin?: string | null;
  resumeSeconds?: number | null;
}

function normaliseProviderMetadata(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en")
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

export const academyMediaRegistry = [
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

export const academyMediaById: ReadonlyMap<string, MediaSpec> = new Map(
  academyMediaRegistry.map((media) => [media.id, media])
);

export const academyMediaByLessonId: Readonly<Record<string, readonly string[]>> = {
  "EML-E1-D04-L01": ["mit-calculus-course-introduction"],
  "EML-E1-D04-L03": ["mit-calculus-chain-rule"],
  "EML-E1-D04-L06": ["mit-calculus-inverse-differentiation"],
  "EML-E2-D11-L02": ["mit-circuits-basic-analysis"]
};

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
  if (media.endSeconds !== null && media.endSeconds > 0) {
    embedUrl.searchParams.set("end", String(Math.floor(media.endSeconds)));
  }
  return embedUrl.toString();
}
