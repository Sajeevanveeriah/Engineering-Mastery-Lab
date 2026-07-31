import process from "node:process";
import { createServer } from "vite";

const vite = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true }
});
const {
  academyMediaById,
  academyMediaGaps,
  academyMediaPlacements,
  buildPrivacyEmbedUrl,
  validateAcademyMediaProviderMetadata
} = await vite.ssrLoadModule("/src/data/academyMedia.ts");

const requestTimeoutMilliseconds = 15_000;
const responseBodyTimeoutMilliseconds = 60_000;
let playerUrl = null;
const androidClient = {
  clientName: "ANDROID",
  clientVersion: "20.10.38",
  androidSdkVersion: 35,
  hl: "en",
  gl: "AU"
};

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(url, label, options = {}, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(new DOMException(`${label} timed out.`, "TimeoutError")),
        requestTimeoutMilliseconds
      );
      const response = await fetch(url, {
        ...options,
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Engineering-Mastery-Lab-Media-Validator/2.0",
          ...options.headers
        }
      });
      clearTimeout(timeout);
      if (response.ok) return response;
      lastError = new Error(`${label} returned HTTP ${response.status}.`);
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
    }
    await delay(500 * (attempt + 1));
  }
  throw lastError ?? new Error(`${label} failed without a response.`);
}

async function readResponseBody(response, label, reader) {
  let timeout;
  try {
    return await Promise.race([
      reader(),
      new Promise((_, reject) => {
        timeout = setTimeout(async () => {
          await response.body?.cancel().catch(() => undefined);
          reject(new DOMException(`${label} body timed out.`, "TimeoutError"));
        }, responseBodyTimeoutMilliseconds);
      })
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestText(url, label, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await request(url, label, {}, 1);
      return await readResponseBody(response, label, () => response.text());
    } catch (error) {
      lastError = error;
      await delay(500 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(`${label} body failed without a response.`);
}

const placementByMediaId = new Map();
for (const placement of academyMediaPlacements) {
  const current = placementByMediaId.get(placement.mediaId) ?? [];
  current.push(placement);
  placementByMediaId.set(placement.mediaId, current);
}
const productionMedia = [...placementByMediaId.keys()].map((mediaId) => {
  const media = academyMediaById.get(mediaId);
  if (!media) throw new Error(`Placement references missing media ${mediaId}.`);
  return media;
});

const bootstrapHtml = await requestText(
  `https://www.youtube-nocookie.com/embed/${productionMedia[0].providerId}`,
  "YouTube embed bootstrap"
);
const innertubeApiKey =
  bootstrapHtml.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
if (!innertubeApiKey) {
  throw new Error(
    "The current YouTube embed bootstrap did not expose an Innertube API key."
  );
}
const currentPlayerUrl = new URL("https://www.youtube.com/youtubei/v1/player");
currentPlayerUrl.searchParams.set("key", innertubeApiKey);
playerUrl = currentPlayerUrl.toString();

async function validateMedia(media) {
  const embedUrl = buildPrivacyEmbedUrl(media);
  if (!embedUrl) {
    throw new Error("The reviewed registry did not produce a permitted embed URL.");
  }
  const oEmbedUrl = new URL("https://www.youtube.com/oembed");
  oEmbedUrl.searchParams.set("url", media.originalUrl);
  oEmbedUrl.searchParams.set("format", "json");

  const [playerResponse, oEmbedResponse, embedResponse] = await Promise.all([
    request(playerUrl, "YouTube player metadata", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent":
          "com.google.android.youtube/20.10.38 (Linux; U; Android 14)"
      },
      body: JSON.stringify({
        videoId: media.providerId,
        context: { client: androidClient }
      })
    }),
    request(oEmbedUrl, "YouTube oEmbed"),
    request(embedUrl, "Privacy-enhanced embed")
  ]);
  const [player, oEmbed] = await Promise.all([
    readResponseBody(
      playerResponse,
      "YouTube player metadata",
      () => playerResponse.json()
    ),
    readResponseBody(oEmbedResponse, "YouTube oEmbed", () => oEmbedResponse.json())
  ]);
  await embedResponse.body?.cancel();

  const captionTracks =
    player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const captionLanguages = [
    ...new Set(captionTracks.map((track) => track?.languageCode).filter(Boolean))
  ];
  const englishCaptions = captionTracks.some(
    (track) => track?.languageCode === "en"
  );
  const durationSeconds = Number(player.videoDetails?.lengthSeconds);
  const durationMatches = Number.isFinite(durationSeconds)
    && media.durationMinutes !== null
    && Math.abs(media.durationMinutes * 60 - durationSeconds) <= 1;
  const { titleMatches, authorMatches } =
    validateAcademyMediaProviderMetadata(media, {
      title: oEmbed.title,
      author: oEmbed.author_name
    });
  const placements = placementByMediaId.get(media.id) ?? [];
  const segmentsValid = Number.isFinite(durationSeconds)
    && placements.every((placement) =>
      placement.startSeconds >= 0
      && placement.startSeconds < durationSeconds
      && placement.endSeconds !== null
      && placement.endSeconds > placement.startSeconds
      && placement.endSeconds <= durationSeconds
    );
  const privacyHost = new URL(embedUrl).hostname;
  const metadataPass =
    player.playabilityStatus?.status === "OK"
    && titleMatches
    && authorMatches
    && englishCaptions
    && durationMatches
    && segmentsValid
    && privacyHost === "www.youtube-nocookie.com";

  return {
    id: media.id,
    providerId: media.providerId,
    playerStatus: player.playabilityStatus?.status ?? null,
    embedStatus: embedResponse.status,
    oEmbedStatus: oEmbedResponse.status,
    titleMatches,
    authorMatches,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    durationMatches,
    captionLanguages,
    englishCaptions,
    placementCount: placements.length,
    segmentsValid,
    privacyHost,
    metadataPass
  };
}

async function validateAll(mediaItems, workerCount = 6) {
  const results = new Array(mediaItems.length);
  let nextIndex = 0;
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < mediaItems.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = await validateMedia(mediaItems[index]);
      } catch (error) {
        results[index] = {
          id: mediaItems[index].id,
          providerId: mediaItems[index].providerId,
          metadataPass: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

console.log(
  "Opt-in metadata validation: this command contacts YouTube and checks current player metadata, oEmbed identity, English caption-track availability, placement bounds and privacy-enhanced embed document reachability. It does not establish real playback or WebView2 compatibility."
);
console.log(JSON.stringify({
  mappedLessons: 175 - academyMediaGaps.length,
  mediaGaps: academyMediaGaps.length,
  requiredLessons: 175,
  productionMedia: productionMedia.length
}, null, 2));

let results = await validateAll(productionMedia);
for (let recoveryRound = 1; recoveryRound <= 3; recoveryRound += 1) {
  const failedIndexes = results
    .map((result, index) => result.metadataPass ? -1 : index)
    .filter((index) => index >= 0);
  if (failedIndexes.length === 0) break;
  await delay(recoveryRound * 1_000);
  for (const index of failedIndexes) {
    try {
      results[index] = await validateMedia(productionMedia[index]);
    } catch (error) {
      results[index] = {
        id: productionMedia[index].id,
        providerId: productionMedia[index].providerId,
        metadataPass: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

console.table(results.map((result) => ({
  id: result.id,
  player: result.playerStatus ?? "failed",
  embed: result.embedStatus ?? "failed",
  oEmbed: result.oEmbedStatus ?? "failed",
  seconds: result.durationSeconds ?? "unknown",
  title: result.titleMatches ? "match" : "mismatch",
  author: result.authorMatches ? "match" : "mismatch",
  captions: result.englishCaptions ? "English" : "not confirmed",
  placements: result.placementCount ?? 0,
  segments: result.segmentsValid ? "valid" : "invalid",
  result: result.metadataPass ? "METADATA PASS" : "FAIL"
})));

if (academyMediaGaps.length > 0 || results.some((result) => !result.metadataPass)) {
  console.error(JSON.stringify({
    status: "FAIL",
    validationScope: "provider metadata, captions, segment bounds and embed reachability",
    playbackStatus: "NOT_TESTED",
    mediaGapLessonIds: academyMediaGaps.map((gap) => gap.lessonId),
    failed: results.filter((result) => !result.metadataPass)
  }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "METADATA_PASS",
    validationScope: "provider metadata, captions, segment bounds and embed reachability",
    playbackStatus: "NOT_TESTED",
    lessons: academyMediaPlacements.length,
    productionMedia: productionMedia.length
  }, null, 2));
}

await vite.close();
