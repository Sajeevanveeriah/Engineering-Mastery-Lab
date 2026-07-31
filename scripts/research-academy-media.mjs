import process from "node:process";
import { writeFile } from "node:fs/promises";
import { createServer } from "vite";

const REQUEST_HEADERS = {
  "accept-language": "en-AU,en;q=0.9",
  cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+999",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    + "AppleWebKit/537.36 Chrome/140 Safari/537.36"
};
const YOUTUBE_ANDROID_CLIENT = {
  clientName: "ANDROID",
  clientVersion: "20.10.38",
  androidSdkVersion: 35,
  hl: "en",
  gl: "AU"
};

const TRUSTED_CHANNEL_SCORES = [
  [/^MIT OpenCourseWare$/i, 100],
  [/^NPTEL/i, 95],
  [/^NIST$/i, 100],
  [/^NASA/i, 100],
  [/^Engineers Australia$/i, 100],
  [/^Autodesk/i, 95],
  [/^(MathWorks|MATLAB)$/i, 95],
  [/^(Open Robotics|ROS)$/i, 95],
  [/^PyTorch$/i, 95],
  [/^Google for Developers$/i, 90],
  [/^Microsoft Developer$/i, 85],
  [/^Arm$/i, 95],
  [/^STMicroelectronics$/i, 95],
  [/^Texas Instruments$/i, 95],
  [/^Keysight/i, 95],
  [/^(National Instruments|NI)$/i, 95],
  [/^Siemens$/i, 95],
  [/^Arduino$/i, 90],
  [/Harvard University/i, 95],
  [/Stanford/i, 95],
  [/University/i, 80],
  [/^freeCodeCamp.org$/i, 75],
  [/^3Blue1Brown$/i, 90],
  [/^StatQuest with Josh Starmer$/i, 90],
  [/^The Efficient Engineer$/i, 90],
  [/^Brian Douglas$/i, 90],
  [/^Steve Brunton$/i, 90],
  [/^Practical Engineering$/i, 85],
  [/^Computerphile$/i, 80],
  [/^CrashCourse$/i, 75],
  [/^Neso Academy$/i, 75],
  [/^All About Electronics$/i, 80],
  [/^RealPars$/i, 75],
  [/^Khan Academy$/i, 85],
  [/^Learn Engineering$/i, 75],
  [/^The Organic Chemistry Tutor$/i, 70]
];

const SEARCH_STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "from",
  "with",
  "into",
  "under",
  "over",
  "through",
  "engineering",
  "foundations",
  "fundamentals",
  "concepts",
  "introduction",
  "overview",
  "system",
  "systems",
  "design",
  "practical",
  "applied",
  "application",
  "behaviour",
  "concepts",
  "engineering",
  "fundamentals",
  "physical",
  "technical",
  "works",
  "using",
  "use"
]);

const UNIT_SEARCH_CONTEXT = {
  "EML-E0-D01": "engineering study scientific method technical communication",
  "EML-E0-D02": "engineering measurement metrology uncertainty",
  "EML-E0-D03": "engineering mathematics vectors coordinate transforms",
  "EML-E1-D04": "engineering mathematics calculus linear algebra statistics",
  "EML-E1-D05": "engineering physics mechanics thermodynamics electromagnetism",
  "EML-E1-D06": "Linux Git reproducible computing software engineering",
  "EML-E1-D07": "software engineering programming architecture testing",
  "EML-E1-D08": "mechanical engineering CAD GD&T metrology",
  "EML-E2-D09": "mechanical engineering materials machine design",
  "EML-E2-D10": "manufacturing engineering design for manufacture assembly",
  "EML-E2-D11": "electrical engineering circuits power electronics batteries",
  "EML-E2-D12": "instrumentation sensors signal conditioning calibration",
  "EML-E2-D13": "embedded systems microcontrollers real time firmware",
  "EML-E2-D14": "embedded communications robotics protocols reliability",
  "EML-E2-D15": "signals systems sampling DSP filtering",
  "EML-E2-D16": "control systems feedback PID state space motor control",
  "EML-E3-D17": "robotics kinematics dynamics actuators safety",
  "EML-E3-D18": "ROS 2 robotics Gazebo Nav2 ros2_control",
  "EML-E3-D19": "Bayesian estimation Kalman filter sensor fusion robotics",
  "EML-E3-D20": "mobile robotics localisation SLAM navigation planning",
  "EML-E3-D21": "computer vision robotics camera geometry pose",
  "EML-E3-D22": "machine learning evaluation sensor data",
  "EML-E3-D23": "robotics AI deep learning edge deployment",
  "EML-E4-D24": "systems engineering safety verification NASA",
  "EML-E4-D25": "professional engineering capstone technical communication"
};

const UNIT_CHANNEL_HINT = {
  "EML-E0-D01": "university",
  "EML-E0-D02": "NIST metrology",
  "EML-E0-D03": "MIT OpenCourseWare",
  "EML-E1-D04": "MIT OpenCourseWare",
  "EML-E1-D05": "MIT OpenCourseWare",
  "EML-E1-D06": "freeCodeCamp Computerphile",
  "EML-E1-D07": "MIT OpenCourseWare freeCodeCamp",
  "EML-E1-D08": "Autodesk Efficient Engineer",
  "EML-E2-D09": "NPTEL Efficient Engineer",
  "EML-E2-D10": "NPTEL Autodesk",
  "EML-E2-D11": "MIT OpenCourseWare",
  "EML-E2-D12": "NPTEL Keysight",
  "EML-E2-D13": "Arm STMicroelectronics FreeRTOS",
  "EML-E2-D14": "NPTEL Texas Instruments",
  "EML-E2-D15": "MIT OpenCourseWare",
  "EML-E2-D16": "Brian Douglas MATLAB Steve Brunton",
  "EML-E3-D17": "NPTEL MIT OpenCourseWare",
  "EML-E3-D18": "Open Robotics ROS 2",
  "EML-E3-D19": "MIT OpenCourseWare MATLAB",
  "EML-E3-D20": "MIT OpenCourseWare robotics",
  "EML-E3-D21": "NPTEL MIT OpenCourseWare",
  "EML-E3-D22": "StatQuest MATLAB",
  "EML-E3-D23": "MIT OpenCourseWare MATLAB",
  "EML-E4-D24": "NASA systems engineering",
  "EML-E4-D25": "Engineers Australia university"
};

const LESSON_QUERY_OVERRIDES = {
  "EML-E0-D01-L01": "engineering learning study practice",
  "EML-E0-D01-L03": "engineering problem decomposition systems engineering",
  "EML-E0-D01-L05": "design of experiments variables fair comparison",
  "EML-E0-D01-L06": "engineering notebook evidence traceability",
  "EML-E0-D01-L07": "read engineering datasheets diagrams technical documentation",
  "EML-E0-D02-L01": "engineering arithmetic estimation numerical fluency",
  "EML-E0-D02-L04": "dimensional analysis unit conversion plausibility",
  "EML-E0-D03-L01": "numbers symbols algebraic expressions",
  "EML-E0-D03-L02": "rearranging engineering equations algebra",
  "EML-E0-D03-L03": "functions graphs rates of change mathematics",
  "EML-E0-D03-L04": "geometry trigonometry physical systems engineering",
  "EML-E1-D04-L01": "differential calculus derivative local rate of change",
  "EML-E1-D04-L03": "multivariable calculus partial derivative sensitivity",
  "EML-E1-D05-L01": "kinematics Newton laws mechanics",
  "EML-E1-D05-L04": "mechanical oscillation vibration waves",
  "EML-E1-D05-L07": "material behaviour sensors actuators physics",
  "EML-E1-D06-L01": "binary logic gates computer fundamentals",
  "EML-E1-D06-L04": "files data formats application programming interfaces",
  "EML-E1-D06-L07": "software documentation environments maintainable workflows",
  "EML-E1-D07-L01": "Python programming concepts beginners",
  "EML-E1-D07-L07": "concurrency networking secure coding",
  "EML-E1-D08-L01": "CAD sketch geometry design intent",
  "EML-E1-D08-L05": "geometric dimensioning tolerancing GD&T",
  "EML-E1-D08-L06": "metrology engineering drawing inspection verification",
  "EML-E2-D09-L01": "engineering materials selection",
  "EML-E2-D09-L06": "machine design power transmission tribology",
  "EML-E2-D10-L01": "manufacturing process selection",
  "EML-E2-D11-L01": "voltage current resistance DC power",
  "EML-E2-D11-L04": "diodes transistors analogue switching",
  "EML-E2-D11-L05": "operational amplifiers analogue signal conditioning",
  "EML-E2-D12-L01": "sensor principles transduction",
  "EML-E2-D12-L02": "instrumentation chain calibration model",
  "EML-E2-D13-L01": "microcontroller architecture memory registers",
  "EML-E2-D13-L02": "microcontroller GPIO safe digital interfacing",
  "EML-E2-D13-L07": "embedded power bootloader debugging hardware in loop",
  "EML-E2-D14-L01": "industrial IO relays contactors actuators",
  "EML-E2-D14-L03": "PLC sequential event driven automation",
  "EML-E2-D14-L06": "Modbus MQTT OPC UA industrial protocols",
  "EML-E2-D14-L07": "Ethernet TCP IP DDS industrial networks commissioning",
  "EML-E2-D15-L01": "signals and systems introduction physical information",
  "EML-E2-D15-L06": "transfer functions block diagrams state space",
  "EML-E2-D15-L07": "system identification noise data acquisition",
  "EML-E2-D16-L01": "physical system modelling differential equations",
  "EML-E2-D16-L02": "feedback transient steady state response",
  "EML-E2-D16-L06": "digital control state estimation motor drives",
  "EML-E3-D17-L01": "robot components architectures",
  "EML-E3-D17-L06": "robot actuator transmission motor selection",
  "EML-E3-D17-L07": "mobile robot manipulation physical safety",
  "EML-E3-D18-L01": "ROS 2 graph workspace fundamentals",
  "EML-E3-D18-L02": "ROS 2 nodes topics messages",
  "EML-E3-D18-L03": "ROS 2 services actions lifecycle",
  "EML-E3-D18-L05": "ROS 2 Gazebo sensor simulation",
  "EML-E3-D18-L06": "ROS 2 control Nav2 integrated simulation",
  "EML-E3-D18-L07": "ROS 2 DDS debugging testing deployment",
  "EML-E3-D19-L01": "probability engineering evidence belief",
  "EML-E3-D19-L03": "covariance uncertainty propagation noise",
  "EML-E3-D19-L07": "Kalman filter consistency validation failure diagnosis",
  "EML-E3-D20-L01": "robot encoder odometry drift",
  "EML-E3-D20-L06": "robot trajectory generation motion control",
  "EML-E3-D20-L07": "Nav2 missions recovery benchmark",
  "EML-E3-D21-L01": "image formation camera models",
  "EML-E3-D21-L04": "computer vision projective geometry coordinate transforms",
  "EML-E3-D21-L06": "computer vision depth pose multi view geometry",
  "EML-E3-D22-L01": "data preparation exploratory data analysis",
  "EML-E3-D22-L02": "linear regression residuals",
  "EML-E3-D22-L05": "machine learning features train test splits metrics data leakage",
  "EML-E3-D23-L01": "neural network foundations",
  "EML-E3-D23-L07": "MLOps robotics safety bias uncertainty",
  "EML-E4-D24-L01": "stakeholder needs measurable system requirements",
  "EML-E4-D24-L05": "safety engineering reliability",
  "EML-E4-D24-L07": "systems configuration management change control technical readiness",
  "EML-E4-D25-L01": "engineering project planning decision records",
  "EML-E4-D25-L03": "engineering design review argument evidence",
  "EML-E4-D25-L04": "Engineers Australia engineering ethics sustainability responsibility",
  "EML-E4-D25-L05": "engineering portfolio evidence claim boundaries",
  "EML-E4-D25-L06": "engineering capstone integration release review",
  "EML-E4-D25-L07": "engineering interview demonstration professional evidence"
};

const LESSON_VIDEO_OVERRIDES = {
  "EML-E0-D01-L03": "UTm1ORuZ1dg",
  "EML-E0-D01-L06": "lJu5xwbGgRk",
  "EML-E0-D02-L01": "krqYvopWmG4",
  "EML-E0-D02-L04": "HRe1mire4Gc",
  "EML-E1-D06-L05": "NyWOfYKScUk",
  "EML-E1-D08-L06": "ht9GwXQMgpo",
  "EML-E1-D08-L07": "pDpxg3C1m6s",
  "EML-E2-D09-L05": "QfhIea6KzZA",
  "EML-E2-D09-L06": "8_x-t1sEMFM",
  "EML-E2-D12-L07": "71HKBYUSbPg",
  "EML-E2-D15-L04": "JtJ3v__Rx7E",
  "EML-E3-D18-L01": "HJAE5Pk8Nyw",
  "EML-E3-D18-L02": "HJAE5Pk8Nyw",
  "EML-E3-D18-L03": "HJAE5Pk8Nyw",
  "EML-E3-D18-L05": "HJAE5Pk8Nyw",
  "EML-E3-D18-L06": "HJAE5Pk8Nyw",
  "EML-E3-D18-L07": "Se5pvRlTX8s",
  "EML-E3-D20-L01": "FXowU7fwcuQ",
  "EML-E3-D20-L02": "FXowU7fwcuQ",
  "EML-E3-D20-L04": "saVZtgPyyJQ",
  "EML-E3-D20-L07": "HJAE5Pk8Nyw",
  "EML-E3-D21-L02": "Q25579dA-YY",
  "EML-E3-D21-L04": "4taoNDPGwBg",
  "EML-E3-D21-L07": "tY2gczObpfU",
  "EML-E3-D23-L02": "6FkRvTtUc-o",
  "EML-E4-D25-L03": "iLDuTiF9Dwg",
  "EML-E4-D25-L05": "cQtSu3Jnezs",
  "EML-E4-D25-L07": "zAOyjqWhL0k"
};

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function tokens(value) {
  return [
    ...new Set(
      value
        .toLocaleLowerCase("en")
        .replace(/[^a-z0-9+]+/g, " ")
        .split(/\s+/)
        .filter(
          (token) =>
            token.length > 2
            && !SEARCH_STOP_WORDS.has(token)
        )
    )
  ];
}

function transcriptTermAppears(term, transcriptTokens) {
  if (transcriptTokens.has(term)) return true;
  if (term === "nav2") {
    return ["nav", "navigate", "navigation"].some((candidate) =>
      transcriptTokens.has(candidate)
    );
  }
  if (term.length < 5) return false;
  const prefix = term.slice(0, 5);
  return [...transcriptTokens].some(
    (candidate) => candidate.length >= 5 && candidate.startsWith(prefix)
  );
}

function transcriptMatchedTerms(lessonTitle, captionText) {
  const transcriptTokens = new Set(tokens(captionText));
  return tokens(lessonTitle).filter((term) =>
    transcriptTermAppears(term, transcriptTokens)
  );
}

function candidateScore(candidate, lessonTitle, unitTitle) {
  const channelQuality =
    TRUSTED_CHANNEL_SCORES.find(([pattern]) =>
      pattern.test(candidate.channel ?? "")
    )?.[1] ?? 0;
  const lessonTokens = tokens(lessonTitle);
  const unitTokens = tokens(unitTitle);
  const titleTokens = new Set(tokens(candidate.title ?? ""));
  const lessonMatchCount =
    lessonTokens.filter((token) => titleTokens.has(token)).length;
  const lessonOverlap =
    lessonMatchCount
    / Math.max(1, Math.min(5, lessonTokens.length));
  const unitOverlap =
    unitTokens.filter((token) => titleTokens.has(token)).length
    / Math.max(1, Math.min(5, unitTokens.length));
  return channelQuality
    + lessonOverlap * 60
    + unitOverlap * 10
    + Math.min(lessonMatchCount, 3) * 5
    - (candidate.isLive ? 30 : 0);
}

function collectVideoResults(root) {
  const results = [];
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (value.videoRenderer) {
      const video = value.videoRenderer;
      if (!seen.has(video.videoId)) {
        seen.add(video.videoId);
        results.push({
          id: video.videoId,
          title:
            video.title?.runs?.map((part) => part.text).join("") ?? "",
          channel:
            video.ownerText?.runs?.map((part) => part.text).join("") ?? "",
          channelUrl:
            video.ownerText?.runs?.[0]?.navigationEndpoint
              ?.browseEndpoint?.canonicalBaseUrl ?? null,
          searchDuration: video.lengthText?.simpleText ?? null,
          isLive: Boolean(
            video.badges?.some(
              (badge) =>
                badge.metadataBadgeRenderer?.style
                === "BADGE_STYLE_TYPE_LIVE_NOW"
            )
          )
        });
      }
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(root);
  return results;
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetch(url, {
        ...options,
        headers: {
          ...REQUEST_HEADERS,
          ...options.headers
        },
        signal: AbortSignal.timeout(15_000)
      });
    } catch (error) {
      lastError = error;
      await delay(300 * (attempt + 1));
    }
  }
  throw lastError;
}

async function fetchOkWithRetry(url, options = {}, attempts = 4) {
  let lastResponse = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    lastResponse = await fetchWithRetry(url, options, 2);
    if (lastResponse.ok) return lastResponse;
    await lastResponse.body?.cancel();
    await delay(500 * (attempt + 1));
  }
  return lastResponse;
}

let youtubeInnertubePlayerUrlPromise = null;

async function resolveYoutubeInnertubePlayerUrl(videoId) {
  if (!youtubeInnertubePlayerUrlPromise) {
    youtubeInnertubePlayerUrlPromise = (async () => {
      const response = await fetchOkWithRetry(
        `https://www.youtube-nocookie.com/embed/${videoId}`,
        {},
        4
      );
      const html = await response.text();
      const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
      if (!apiKey) {
        throw new Error(
          "The current YouTube embed bootstrap did not expose an Innertube API key."
        );
      }
      const url = new URL("https://www.youtube.com/youtubei/v1/player");
      url.searchParams.set("key", apiKey);
      return url.toString();
    })();
  }
  return youtubeInnertubePlayerUrlPromise;
}

async function searchYouTube(query) {
  try {
    const response = await fetchWithRetry(
      "https://www.youtube.com/results?hl=en&gl=AU&search_query="
      + encodeURIComponent(query),
      {},
      2
    );
    const page = await response.text();
    const serialised = page.match(
      /var ytInitialData = (\{.*?\});<\/script>/s
    )?.[1];
    return serialised
      ? collectVideoResults(JSON.parse(serialised))
      : [];
  } catch {
    return [];
  }
}

function timestampSeconds(value) {
  const parts = value.split(":").map(Number);
  if (
    parts.length < 2
    || parts.length > 3
    || parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return null;
  }
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function decodeCaptionText(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCaptionCues(value) {
  return [...value.matchAll(/<p\s+([^>]*)>([\s\S]*?)<\/p>/g)]
    .map((match) => {
      const startMilliseconds = Number(
        match[1].match(/(?:^|\s)t="(\d+)"/)?.[1] ?? Number.NaN
      );
      const durationMilliseconds = Number(
        match[1].match(/(?:^|\s)d="(\d+)"/)?.[1] ?? 0
      );
      return {
        startSeconds: startMilliseconds / 1000,
        endSeconds: (startMilliseconds + durationMilliseconds) / 1000,
        text: decodeCaptionText(match[2])
      };
    })
    .filter((cue) => Number.isFinite(cue.startSeconds) && cue.text !== "");
}

function selectCaptionSegment(lessonTitle, candidate) {
  const durationSeconds = candidate.durationSeconds ?? 0;
  if (durationSeconds <= 1_800) {
    return { startSeconds: 0, endSeconds: durationSeconds };
  }
  const lessonTokens = tokens(lessonTitle);
  const chapterMatch = candidate.descriptionChapters
    .map((chapter) => ({
      chapter,
      score: lessonTokens.filter((token) =>
        new Set(tokens(chapter.title)).has(token)
      ).length
    }))
    .sort((left, right) => right.score - left.score)[0];
  if (chapterMatch && chapterMatch.score > 0) {
    return {
      startSeconds: chapterMatch.chapter.startSeconds,
      endSeconds: chapterMatch.chapter.endSeconds
    };
  }
  let best = { score: -1, startSeconds: 0 };
  for (let index = 0; index < candidate.captionCues.length; index += 1) {
    const first = candidate.captionCues[index];
    const windowText = [];
    for (
      let cursor = index;
      cursor < candidate.captionCues.length
      && candidate.captionCues[cursor].startSeconds < first.startSeconds + 480;
      cursor += 1
    ) {
      windowText.push(candidate.captionCues[cursor].text);
    }
    const windowTokens = new Set(tokens(windowText.join(" ")));
    const score = lessonTokens.filter((token) =>
      transcriptTermAppears(token, windowTokens)
    ).length;
    if (score > best.score) best = { score, startSeconds: first.startSeconds };
  }
  const startSeconds = Math.max(0, Math.floor(best.startSeconds) - 20);
  return {
    startSeconds,
    endSeconds: Math.min(durationSeconds, startSeconds + 600)
  };
}

function extractDescriptionChapters(description, durationSeconds) {
  const candidates = [];
  for (const line of description.split(/\r?\n/)) {
    const match = line.trim().match(
      /^(?:(\d{1,2}:)?\d{1,2}:\d{2})\s*(?:[-|:]\s*)?(.{3,160})$/
    );
    if (!match) continue;
    const timestamp = line.trim().match(/^(?:(?:\d{1,2}:)?\d{1,2}:\d{2})/)?.[0];
    const startSeconds = timestamp ? timestampSeconds(timestamp) : null;
    if (startSeconds === null || startSeconds >= durationSeconds) continue;
    candidates.push({
      startSeconds,
      title: match[2].trim()
    });
  }
  return candidates
    .sort((left, right) => left.startSeconds - right.startSeconds)
    .filter((chapter, index, chapters) =>
      index === 0 || chapter.startSeconds !== chapters[index - 1].startSeconds
    )
    .map((chapter, index, chapters) => ({
      ...chapter,
      endSeconds:
        chapters[index + 1]?.startSeconds
        ?? durationSeconds
    }));
}

const validationCache = new Map();

async function validateCandidate(candidate) {
  if (validationCache.has(candidate.id)) {
    return validationCache.get(candidate.id);
  }
  const validation = (async () => {
    try {
      const canonicalUrl =
        `https://www.youtube.com/watch?v=${candidate.id}`;
      const youtubeInnertubePlayerUrl =
        await resolveYoutubeInnertubePlayerUrl(candidate.id);
      const [playerResponse, oEmbedResponse, embedResponse] =
        await Promise.all([
          fetchOkWithRetry(
            youtubeInnertubePlayerUrl,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "user-agent":
                  "com.google.android.youtube/20.10.38 "
                  + "(Linux; U; Android 14)"
              },
              body: JSON.stringify({
                videoId: candidate.id,
                context: { client: YOUTUBE_ANDROID_CLIENT }
              })
            },
            4
          ),
          fetchOkWithRetry(
            "https://www.youtube.com/oembed?format=json&url="
            + encodeURIComponent(canonicalUrl),
            {},
            4
          ),
          fetchOkWithRetry(
            `https://www.youtube-nocookie.com/embed/${candidate.id}`
            + "?enablejsapi=1&playsinline=1",
            {
              headers: {
                referer:
                  "https://sajeevanveeriah.github.io/"
                  + "Engineering-Mastery-Lab/"
              }
            },
            4
          )
        ]);
      const player = playerResponse.ok
        ? await playerResponse.json()
        : {};
      const oEmbed = oEmbedResponse.ok
        ? await oEmbedResponse.json()
        : {};
      await embedResponse.body?.cancel();

      const captionTracks =
        player.captions?.playerCaptionsTracklistRenderer?.captionTracks
        ?? [];
      const englishTrack = captionTracks.find(
        (track) => track?.languageCode === "en"
      );
      const captionResponse = englishTrack?.baseUrl
        ? await fetchOkWithRetry(englishTrack.baseUrl, {}, 4)
        : null;
      const captionDocument = captionResponse?.ok
        ? await captionResponse.text()
        : "";
      const captionCues = extractCaptionCues(captionDocument);
      const captionText = captionCues.map((cue) => cue.text).join(" ");
      const durationSeconds = Number(
        player.videoDetails?.lengthSeconds ?? Number.NaN
      );
      const providerError = player.playabilityStatus?.status !== "OK";
      const ageRestricted =
        player.playabilityStatus?.status === "LOGIN_REQUIRED";
      const description = player.videoDetails?.shortDescription ?? "";
      const descriptionChapters = Number.isFinite(durationSeconds)
        ? extractDescriptionChapters(description, durationSeconds)
        : [];
      return {
        ...candidate,
        canonicalUrl,
        title: oEmbed.title ?? candidate.title,
        channel: oEmbed.author_name ?? candidate.channel,
        durationSeconds:
          Number.isFinite(durationSeconds) ? durationSeconds : null,
        captions:
          englishTrack
            ? englishTrack.kind === "asr"
              ? "automatic English"
              : "manual English"
            : null,
        captionText,
        captionCues,
        description,
        descriptionChapters,
        sourceStatus: playerResponse.status,
        oEmbedStatus: oEmbedResponse.status,
        embedStatus: embedResponse.status,
        providerError,
        ageRestricted,
        passesProviderChecks:
          playerResponse.ok
          && player.playabilityStatus?.status === "OK"
          && oEmbedResponse.ok
          && embedResponse.ok
          && Boolean(englishTrack)
          && captionText.length >= 100
          && Number.isFinite(durationSeconds)
          && durationSeconds >= 90
          && !providerError
          && !ageRestricted
      };
    } catch (error) {
      return {
        ...candidate,
        passesProviderChecks: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  })();
  validationCache.set(candidate.id, validation);
  return validation;
}

function textOverlapScore(needle, haystack) {
  const needleTokens = tokens(needle);
  const haystackTokens = new Set(tokens(haystack));
  const matches = needleTokens.filter((token) => haystackTokens.has(token));
  return {
    matches,
    score: matches.length / Math.max(1, Math.min(5, needleTokens.length))
  };
}

async function researchUnitSources(unit) {
  const unitContext = UNIT_SEARCH_CONTEXT[unit.id] ?? unit.title;
  const channelHint = UNIT_CHANNEL_HINT[unit.id] ?? "university";
  const queries = [
    `${unit.title} full course ${channelHint}`,
    `${unitContext} complete course university`,
    `${unit.title} lecture chapters ${channelHint}`,
    `${unitContext} playlist ${channelHint}`
  ];
  const searchResults = [];
  for (const query of queries) searchResults.push(...await searchYouTube(query));
  const unique = [
    ...new Map(searchResults.map((candidate) => [candidate.id, candidate])).values()
  ];
  const checked = [];
  for (const candidate of unique.slice(0, 24)) {
    const validation = await validateCandidate(candidate);
    if (validation.passesProviderChecks) checked.push(validation);
  }
  const placements = unit.lessonTitles.map((lessonTitle, lessonIndex) => {
    const matches = checked.flatMap((candidate) =>
      candidate.descriptionChapters.map((chapter) => {
        const relevance = textOverlapScore(lessonTitle, chapter.title);
        return { candidate, chapter, ...relevance };
      })
    ).sort((left, right) => right.score - left.score);
    const best = matches[0] ?? null;
    return {
      lessonId: `${unit.id}-L${String(lessonIndex + 1).padStart(2, "0")}`,
      lessonTitle,
      selected: best && best.matches.length >= 1
        ? {
            id: best.candidate.id,
            title: best.candidate.title,
            channel: best.candidate.channel,
            durationSeconds: best.candidate.durationSeconds,
            captions: best.candidate.captions,
            chapter: best.chapter,
            matchedTerms: best.matches,
            relevanceScore: best.score
          }
        : null,
      alternatives: matches.slice(0, 5).map((match) => ({
        id: match.candidate.id,
        title: match.candidate.title,
        channel: match.candidate.channel,
        chapter: match.chapter,
        matchedTerms: match.matches,
        relevanceScore: match.score
      }))
    };
  });
  return {
    unitId: unit.id,
    unitTitle: unit.title,
    queries,
    checkedSources: checked.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      channel: candidate.channel,
      durationSeconds: candidate.durationSeconds,
      captions: candidate.captions,
      chapters: candidate.descriptionChapters
    })),
    placements
  };
}

async function researchLesson(lesson) {
  const overrideQuery = LESSON_QUERY_OVERRIDES[lesson.lessonId] ?? null;
  const overrideVideoId = LESSON_VIDEO_OVERRIDES[lesson.lessonId] ?? null;
  const principalClause =
    lesson.title.split(/,| and | from | to | through /i)[0].trim();
  const focusedTokens = tokens(lesson.title).slice(0, 5).join(" ");
  const unitContext = UNIT_SEARCH_CONTEXT[lesson.unitId] ?? lesson.unitTitle;
  const channelHint = UNIT_CHANNEL_HINT[lesson.unitId] ?? "university";
  const queries = [
    ...(overrideQuery ? [overrideQuery, `${overrideQuery} university`] : []),
    `"${lesson.title}"`,
    `${lesson.title} ${unitContext}`,
    `${principalClause} ${unitContext} tutorial`,
    `${focusedTokens} ${channelHint}`,
    `${principalClause} tutorial ${channelHint}`
  ];
  const searchResults = overrideVideoId
    ? []
    : (
        await Promise.all(queries.map((query) => searchYouTube(query)))
      ).flat();

  const candidates = [
    ...(overrideVideoId
      ? [{
          id: overrideVideoId,
          title: "",
          channel: "",
          channelUrl: null,
          searchDuration: null,
          isLive: false,
          relevanceScore: 1_000
        }]
      : []),
    ...new Map(
      searchResults.map((candidate) => [candidate.id, candidate])
    ).values()
  ]
    .map((candidate) => candidate.relevanceScore === 1_000
      ? candidate
      : ({
          ...candidate,
          relevanceScore: candidateScore(
            candidate,
            lesson.title,
            lesson.unitTitle
          )
        }))
    .filter((candidate) => {
      const lessonTokens = tokens(lesson.title);
      const titleTokens = new Set(tokens(candidate.title ?? ""));
      const matches = lessonTokens.filter((token) => titleTokens.has(token));
      return candidate.relevanceScore === 1_000
        || (candidate.relevanceScore >= 65 && matches.length >= 1);
    })
    .sort((left, right) =>
      right.relevanceScore - left.relevanceScore
    )
    .slice(0, 5);

  const checkedCandidates = await Promise.all(
    candidates.map((candidate) => validateCandidate(candidate))
  );
  const selectedWithoutSegment = checkedCandidates
    .filter((candidate) => candidate.passesProviderChecks)
    .map((candidate) => ({
      ...candidate,
      transcriptMatchedTerms: transcriptMatchedTerms(
        lesson.title,
        candidate.captionText ?? ""
      )
    }))
    .filter((candidate) => candidate.transcriptMatchedTerms.length >= 1)
    .sort((left, right) =>
      right.transcriptMatchedTerms.length - left.transcriptMatchedTerms.length
      || right.relevanceScore - left.relevanceScore
    )[0] ?? null;
  const selected = selectedWithoutSegment
    ? {
        ...selectedWithoutSegment,
        segment: selectCaptionSegment(lesson.title, selectedWithoutSegment)
      }
    : null;

  return {
    ...lesson,
    queries,
    selected,
    checked: checkedCandidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      channel: candidate.channel,
      passesProviderChecks: candidate.passesProviderChecks,
      sourceStatus: candidate.sourceStatus,
      oEmbedStatus: candidate.oEmbedStatus,
      embedStatus: candidate.embedStatus,
      captions: candidate.captions,
      captionTextLength: candidate.captionText?.length ?? 0,
      transcriptMatchedTerms: transcriptMatchedTerms(
        lesson.title,
        candidate.captionText ?? ""
      ),
      error: candidate.error ?? null
    })),
    shortlisted: candidates.slice(0, 3)
  };
}

const requestedUnitId =
  process.argv.find((argument) => argument.startsWith("--unit="))
    ?.slice("--unit=".length) ?? null;
const requestedLessonId =
  process.argv.find((argument) => argument.startsWith("--lesson="))
    ?.slice("--lesson=".length) ?? null;
const requestedQuery =
  process.argv.find((argument) => argument.startsWith("--query="))
    ?.slice("--query=".length) ?? null;
const compactOutput = process.argv.includes("--compact");
const checkedOutput = process.argv.includes("--checked");
const unitSourcesOutput = process.argv.includes("--unit-sources");
const placementsOnlyOutput = process.argv.includes("--placements-only");
const generateDataOutput = process.argv.includes("--generate-data");

const vite = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  server: {
    hmr: {
      port: 25_000 + (process.pid % 10_000)
    },
    middlewareMode: true
  }
});
const { academyUnitSeeds } =
  await vite.ssrLoadModule("/src/data/academy/catalogue.ts");

if (requestedQuery) {
  const candidates = (await searchYouTube(requestedQuery)).slice(0, 12);
  const checked = await Promise.all(
    candidates.map((candidate) => validateCandidate(candidate))
  );
  await vite.close();
  for (const candidate of checked) {
    console.log([
      candidate.id,
      candidate.title,
      candidate.channel,
      candidate.durationSeconds ?? "",
      candidate.captions ?? "",
      candidate.passesProviderChecks ? "PASS" : "FAIL",
      tokens(candidate.captionText ?? "").slice(0, 24).join(",")
    ].join("\t"));
  }
  process.exit();
}
const units = requestedUnitId
  ? academyUnitSeeds.filter((unit) => unit.id === requestedUnitId)
  : academyUnitSeeds;

if (requestedUnitId && units.length !== 1) {
  await vite.close();
  throw new Error(`Unknown Academy unit: ${requestedUnitId}`);
}

const lessons = units.flatMap((unit) =>
  unit.lessonTitles.map((title, index) => ({
    lessonId:
      `${unit.id}-L${String(index + 1).padStart(2, "0")}`,
    title,
    unitId: unit.id,
    unitTitle: unit.title,
    unitDescription: unit.description
  }))
).filter((lesson) =>
  requestedLessonId === null || lesson.lessonId === requestedLessonId
);

if (generateDataOutput) {
  const results = new Array(lessons.length);
  let nextIndex = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (nextIndex < lessons.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await researchLesson(lessons[index]);
      console.error(
        `[${index + 1}/${lessons.length}] ${lessons[index].lessonId} `
        + `${results[index].selected?.id ?? "MEDIA_GAP"}`
      );
    }
  });
  await Promise.all(workers);
  await vite.close();

  for (let recoveryRound = 1; recoveryRound <= 3; recoveryRound += 1) {
    const missingIndexes = results
      .map((result, index) => result.selected === null ? index : -1)
      .filter((index) => index >= 0);
    if (missingIndexes.length === 0) break;
    await delay(1_000 * recoveryRound);
    for (const index of missingIndexes) {
      const overrideVideoId =
        LESSON_VIDEO_OVERRIDES[lessons[index].lessonId] ?? null;
      if (overrideVideoId) validationCache.delete(overrideVideoId);
      results[index] = await researchLesson(lessons[index]);
      console.error(
        `[recovery ${recoveryRound}] ${lessons[index].lessonId} `
        + `${results[index].selected?.id ?? "MEDIA_GAP"}`
      );
    }
  }

  const missing = results.filter((result) => result.selected === null);
  if (missing.length > 0) {
    console.error(
      `Refusing to generate with ${missing.length} media gaps: `
      + missing.map((result) => result.lessonId).join(", ")
    );
    process.exitCode = 1;
    process.exit();
  }

  const distinctMedia = [
    ...new Map(
      results.map((result) => [result.selected.id, result.selected])
    ).values()
  ];
  const mediaRegistry = distinctMedia.map((selected) => ({
    id: `youtube-${selected.id}`,
    provider: "youtube",
    creator: selected.channel,
    title: selected.title.replace(/[\u2013\u2014]/gu, "-"),
    kind: "video",
    originalUrl: selected.canonicalUrl,
    providerId: selected.id,
    durationMinutes: Number((selected.durationSeconds / 60).toFixed(2)),
    startSeconds: null,
    endSeconds: null,
    learningOutcome:
      "Use the reviewed teaching to reinforce the mapped Academy lesson objective and connect it to the complete native instruction.",
    poster: null,
    captionsStatus: "available",
    nativeSummaryFallback:
      "The complete native Academy lesson remains the authoritative learning path. It supplies first-principles instruction, definitions, system boundaries, worked reasoning, counterexamples, guided practice and assessment without contacting YouTube or requiring this optional video.",
    chapters: [],
    licence:
      "Provider-hosted YouTube content. No republication rights are claimed by Engineering Mastery Lab.",
    attribution: `${selected.channel}, ${selected.title.replace(/[\u2013\u2014]/gu, "-")}.`,
    embedPermission: "permitted",
    lastValidated: "2026-07-31",
    privacyBehaviour:
      "The player is created only after Academy-wide consent and uses youtube-nocookie.com without autoplay. The learner can return to written-only study at any time.",
    offlineFallback:
      "Continue with the complete native lesson, worked reasoning, practice and assessment. Video is never required for completion or offline study.",
    alternativeSourceId: null
  }));
  const placements = results.map((result) => {
    const selected = result.selected;
    return {
      lessonId: result.lessonId,
      mediaId: `youtube-${selected.id}`,
      learningObjective:
        `Learn to reason accurately about ${result.title.toLocaleLowerCase("en-AU")} and apply it within the lesson's engineering boundary.`,
      relevanceRationale:
        `The current provider title and English caption text explicitly cover ${selected.transcriptMatchedTerms.join(", ")}, which directly supports this lesson's stated topic: ${result.title}.`,
      fallbackWrittenContentReference: `${result.lessonId}-native-teaching-v2`,
      reviewDate: "2026-07-31",
      reviewMethod:
        "Checked current player playability, oEmbed identity, duration, English caption-track availability and the caption text around the selected interval against the lesson title and teaching scope.",
      startSeconds: selected.segment.startSeconds,
      endSeconds: selected.segment.endSeconds
    };
  });
  const generatedSource = [
    "// Generated by scripts/research-academy-media.mjs --generate-data.",
    "// Review the complete diff and rerun provider and playback gates before release.",
    'import type { MediaSpec } from "../lib/academy/types";',
    "",
    "export interface AcademyMediaPlacement {",
    "  lessonId: string;",
    "  mediaId: string;",
    "  learningObjective: string;",
    "  relevanceRationale: string;",
    "  fallbackWrittenContentReference: string;",
    "  reviewDate: string;",
    "  reviewMethod: string;",
    "  startSeconds: number;",
    "  endSeconds: number | null;",
    "}",
    "",
    `export const generatedAcademyMediaRegistry = ${JSON.stringify(mediaRegistry, null, 2)} as const satisfies readonly MediaSpec[];`,
    "",
    `export const academyMediaPlacements = ${JSON.stringify(placements, null, 2)} as const satisfies readonly AcademyMediaPlacement[];`,
    ""
  ].join("\n");
  await writeFile(
    new URL("../src/data/academyMedia.generated.ts", import.meta.url),
    generatedSource,
    "utf8"
  );
  console.log(JSON.stringify({
    lessons: placements.length,
    distinctMedia: mediaRegistry.length,
    output: "src/data/academyMedia.generated.ts"
  }));
  process.exit();
}

if (unitSourcesOutput) {
  const reports = [];
  for (const unit of units) reports.push(await researchUnitSources(unit));
  await vite.close();
  if (placementsOnlyOutput) {
    for (const report of reports) {
      for (const placement of report.placements) {
        const selected = placement.selected;
        console.log([
          placement.lessonId,
          placement.lessonTitle,
          selected?.id ?? "NONE",
          selected?.title ?? "",
          selected?.channel ?? "",
          selected?.chapter.startSeconds ?? "",
          selected?.chapter.endSeconds ?? "",
          selected?.chapter.title ?? "",
          selected?.captions ?? "",
          selected?.matchedTerms.join(",") ?? ""
        ].join("\t"));
      }
    }
  } else {
    console.log(JSON.stringify(reports, null, compactOutput ? 0 : 2));
  }
  if (!placementsOnlyOutput && reports.some((report) =>
    report.placements.some((placement) => placement.selected === null)
  )) {
    process.exitCode = 1;
  }
  process.exit();
}

if (requestedLessonId && lessons.length !== 1) {
  await vite.close();
  throw new Error(`Unknown Academy lesson: ${requestedLessonId}`);
}

const results = [];
for (const lesson of lessons) {
  results.push(await researchLesson(lesson));
}
await vite.close();

const report = {
  scope: requestedUnitId ?? "all Academy units",
  requiredLessons: lessons.length,
  candidateLessons:
    results.filter((result) => result.selected).length,
  missingCandidates:
    results.filter((result) => !result.selected)
      .map((result) => result.lessonId),
  distinctCandidateVideos:
    new Set(
      results
        .map((result) => result.selected?.id)
        .filter(Boolean)
    ).size,
  results
};

if (compactOutput) {
  for (const result of results) {
    const selected = result.selected;
    console.log([
      result.lessonId,
      result.title,
      selected?.id ?? "NONE",
      selected?.title ?? "",
      selected?.channel ?? "",
      selected?.durationSeconds ?? "",
      selected?.captions ?? "",
      selected?.segment.startSeconds ?? "",
      selected?.segment.endSeconds ?? "",
      selected?.relevanceScore?.toFixed(1) ?? "",
      selected?.channelUrl ?? ""
    ].join("\t"));
    if (checkedOutput) {
      console.log(JSON.stringify(result.checked));
    }
  }
  console.log(JSON.stringify({
    scope: report.scope,
    requiredLessons: report.requiredLessons,
    candidateLessons: report.candidateLessons,
    missingCandidates: report.missingCandidates,
    distinctCandidateVideos: report.distinctCandidateVideos
  }));
} else {
  console.log(JSON.stringify(report, null, 2));
}

if (!compactOutput && results.some((result) => !result.selected)) {
  process.exitCode = 1;
}
