import process from "node:process";
import {
  academyMediaRegistry,
  buildPrivacyEmbedUrl,
  validateAcademyMediaProviderMetadata
} from "../src/data/academyMedia.ts";

const requestTimeoutMilliseconds = 15_000;

async function request(url, label) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(requestTimeoutMilliseconds),
    headers: {
      "User-Agent": "Engineering-Mastery-Lab-Media-Validator/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }
  return response;
}

function extractCaptionTracks(sourceText) {
  const serialisedTracks = sourceText.match(
    /"captionTracks"\s*:\s*(\[[\s\S]*?\])\s*,\s*"audioTracks"/
  )?.[1];
  if (!serialisedTracks) return [];
  try {
    const tracks = JSON.parse(serialisedTracks);
    return Array.isArray(tracks) ? tracks : [];
  } catch {
    return [];
  }
}

async function validateMedia(media) {
  const embedUrl = buildPrivacyEmbedUrl(media);
  if (!embedUrl) {
    throw new Error("The reviewed registry did not produce a permitted embed URL.");
  }

  const oEmbedUrl = new URL("https://www.youtube.com/oembed");
  oEmbedUrl.searchParams.set("url", media.originalUrl);
  oEmbedUrl.searchParams.set("format", "json");

  const [oEmbedResponse, embedResponse, sourceResponse] = await Promise.all([
    request(oEmbedUrl, "YouTube oEmbed"),
    request(embedUrl, "Privacy-enhanced embed"),
    request(media.originalUrl, "Original provider page")
  ]);
  const [oEmbed, sourceText] = await Promise.all([
    oEmbedResponse.json(),
    sourceResponse.text()
  ]);
  await embedResponse.body?.cancel();

  const captionTracks = extractCaptionTracks(sourceText);
  const captionLanguages = [
    ...new Set(
      captionTracks
        .map((track) => track?.languageCode)
        .filter((languageCode) => typeof languageCode === "string")
    )
  ];
  const manualEnglishCaptions = captionTracks.some(
    (track) =>
      track?.languageCode === "en"
      && track?.kind !== "asr"
  );
  const captionsAdvertised = captionTracks.length > 0;
  const durationSeconds = Number(
    sourceText.match(/"lengthSeconds"\s*:\s*"(\d+)"/)?.[1] ?? Number.NaN
  );
  const providerError = /"playabilityStatus"\s*:\s*\{\s*"status"\s*:\s*"ERROR"/
    .test(sourceText);
  const durationMatches = Number.isFinite(durationSeconds)
    && media.durationMinutes !== null
    && Math.abs(media.durationMinutes * 60 - durationSeconds) <= 1;
  const { titleMatches, authorMatches } =
    validateAcademyMediaProviderMetadata(media, {
      title: oEmbed.title,
      author: oEmbed.author_name
    });

  return {
    id: media.id,
    providerId: media.providerId,
    sourceStatus: sourceResponse.status,
    embedStatus: embedResponse.status,
    oEmbedStatus: oEmbedResponse.status,
    currentTitle: oEmbed.title ?? null,
    currentAuthor: oEmbed.author_name ?? null,
    registryTitle: media.title,
    registryCreator: media.creator,
    titleMatches,
    authorMatches,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    registryDurationMinutes: media.durationMinutes,
    durationMatches,
    captionsAdvertised,
    captionLanguages,
    manualEnglishCaptions,
    privacyHost: new URL(embedUrl).hostname,
    metadataPass:
      titleMatches
      && authorMatches
      && captionsAdvertised
      && manualEnglishCaptions
      && durationMatches
      && !providerError
      && new URL(embedUrl).hostname === "www.youtube-nocookie.com"
  };
}

console.log(
  "Opt-in metadata validation: this command contacts YouTube and checks the current public source, oEmbed metadata, caption-track signal and privacy-enhanced embed document response. It does not establish player readiness, playback, caption quality or desktop WebView compatibility."
);

const settled = await Promise.allSettled(
  academyMediaRegistry.map((media) => validateMedia(media))
);
const results = settled.map((entry, index) => {
  if (entry.status === "fulfilled") return entry.value;
  return {
    id: academyMediaRegistry[index].id,
    providerId: academyMediaRegistry[index].providerId,
    sourceStatus: null,
    embedStatus: null,
    oEmbedStatus: null,
    currentTitle: null,
    currentAuthor: null,
    captionsAdvertised: false,
    captionLanguages: [],
    manualEnglishCaptions: false,
    privacyHost: null,
    metadataPass: false,
    error: entry.reason instanceof Error ? entry.reason.message : String(entry.reason)
  };
});

console.table(results.map((result) => ({
      id: result.id,
      source: result.sourceStatus ?? "failed",
      embed: result.embedStatus ?? "failed",
      oEmbed: result.oEmbedStatus ?? "failed",
      seconds: result.durationSeconds ?? "unknown",
  title: result.titleMatches ? "match" : "mismatch",
  author: result.authorMatches ? "match" : "mismatch",
  captions: result.manualEnglishCaptions
    ? "manual English"
    : result.captionsAdvertised
      ? "other/automatic only"
      : "not confirmed",
  privacyHost: result.privacyHost ?? "unavailable",
  result: result.metadataPass ? "METADATA PASS" : "FAIL"
})));

if (results.some((result) => !result.metadataPass)) {
  console.error(JSON.stringify({
    status: "FAIL",
    validationScope: "provider metadata and embed document reachability only",
    playbackStatus: "NOT_TESTED",
    results
  }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "METADATA_PASS",
    validationScope: "provider metadata and embed document reachability only",
    playbackStatus: "NOT_TESTED",
    results
  }, null, 2));
}
