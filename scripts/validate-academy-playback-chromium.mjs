import { spawn } from "node:child_process";
import { createServer as createHttpServer } from "node:http";
import { createServer as createTcpServer } from "node:net";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { chromium } from "@playwright/test";
import { createServer as createViteServer } from "vite";

const vite = await createViteServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true }
});
const {
  academyMediaById,
  academyMediaPlacements,
  buildPrivacyEmbedUrl
} = await vite.ssrLoadModule("/src/data/academyMedia.ts");

const harnessHtml = `<!doctype html>
<html lang="en-AU">
<head><meta charset="utf-8"><title>Academy media playback audit</title></head>
<body>
  <main><h1>Academy media playback audit</h1><div id="player-host"></div></main>
  <script>
    const audit = {
      errorCode: null,
      firstPlayingTime: null,
      lastPlayingTime: null,
      playerState: null,
      ready: false
    };
    let player = null;
    let listeningTimer = null;

    function send(command, args = []) {
      player?.contentWindow?.postMessage(JSON.stringify({
        event: "command",
        func: command,
        args,
        id: "academy-playback-audit"
      }), "https://www.youtube-nocookie.com");
    }

    function listen() {
      player?.contentWindow?.postMessage(JSON.stringify({
        event: "listening",
        id: "academy-playback-audit"
      }), "https://www.youtube-nocookie.com");
    }

    addEventListener("message", (event) => {
      if (event.origin !== "https://www.youtube-nocookie.com") return;
      let message;
      try {
        message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!message || typeof message !== "object") return;
      if (message.event === "onReady") {
        audit.ready = true;
        send("mute");
        send("playVideo");
      }
      if (message.event === "onError") audit.errorCode = message.info ?? "unknown";
      const state = message.event === "onStateChange"
        ? message.info
        : message.info?.playerState;
      if (typeof state === "number") audit.playerState = state;
      const currentTime = message.info?.currentTime;
      if (audit.playerState === 1 && typeof currentTime === "number") {
        if (audit.firstPlayingTime === null) audit.firstPlayingTime = currentTime;
        audit.lastPlayingTime = currentTime;
      }
    });

    window.startPlaybackAudit = (url) => {
      clearInterval(listeningTimer);
      Object.assign(audit, {
        errorCode: null,
        firstPlayingTime: null,
        lastPlayingTime: null,
        playerState: null,
        ready: false
      });
      document.getElementById("player-host").replaceChildren();
      player = document.createElement("iframe");
      player.id = "academy-playback-audit";
      player.allow = "autoplay; encrypted-media; picture-in-picture";
      player.width = "640";
      player.height = "360";
      player.src = url;
      player.title = "Playback audit player";
      document.getElementById("player-host").append(player);
      listeningTimer = setInterval(listen, 250);
    };
    window.readPlaybackAudit = () => ({ ...audit });
  </script>
</body>
</html>`;

const server = createHttpServer((_request, response) => {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(harnessHtml);
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
if (!address || typeof address === "string") {
  throw new Error("The local playback audit server did not expose a TCP port.");
}
const origin = `http://127.0.0.1:${address.port}`;

const firstPlacementByMediaId = new Map();
for (const placement of academyMediaPlacements) {
  if (!firstPlacementByMediaId.has(placement.mediaId)) {
    firstPlacementByMediaId.set(placement.mediaId, placement);
  }
}
const auditCases = [...firstPlacementByMediaId].map(([mediaId, placement]) => {
  const media = academyMediaById.get(mediaId);
  if (!media) throw new Error(`Missing media for playback case ${mediaId}.`);
  const url = buildPrivacyEmbedUrl(media, {
    origin,
    resumeSeconds: placement.startSeconds,
    endSeconds: placement.endSeconds
  });
  if (!url) throw new Error(`No permitted playback URL for ${mediaId}.`);
  return { media, placement, url };
});

const requestedRuntime = process.argv.find((argument) =>
  argument.startsWith("--runtime=")
)?.slice("--runtime=".length) ?? "chromium";
if (!new Set(["chromium", "webview2"]).has(requestedRuntime)) {
  throw new Error(`Unknown playback runtime ${requestedRuntime}.`);
}

async function reserveLoopbackPort() {
  const probe = createTcpServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const probeAddress = probe.address();
  if (!probeAddress || typeof probeAddress === "string") {
    throw new Error("Could not reserve a WebView2 debugging port.");
  }
  await new Promise((resolve, reject) => probe.close((error) => (
    error ? reject(error) : resolve()
  )));
  return probeAddress.port;
}

let nativeProcess = null;
let browser;
if (requestedRuntime === "webview2") {
  const debuggingPort = await reserveLoopbackPort();
  const executablePath = fileURLToPath(new URL(
    "../src-tauri/target/release/engineering-workbench.exe",
    import.meta.url
  ));
  nativeProcess = spawn(executablePath, [], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:
        `--remote-debugging-port=${debuggingPort} `
        + "--autoplay-policy=no-user-gesture-required"
    },
    stdio: "ignore",
    windowsHide: true
  });
  const endpoint = `http://127.0.0.1:${debuggingPort}`;
  const deadline = Date.now() + 30_000;
  let endpointReady = false;
  while (Date.now() < deadline && nativeProcess.exitCode === null) {
    try {
      const response = await fetch(`${endpoint}/json/version`, {
        signal: AbortSignal.timeout(1_000)
      });
      endpointReady = response.ok;
    } catch {
      endpointReady = false;
    }
    if (endpointReady) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!endpointReady) {
    throw new Error(
      `WebView2 debugging endpoint did not become ready; native exit code: ${nativeProcess.exitCode}.`
    );
  }
  browser = await chromium.connectOverCDP(endpoint);
} else {
  browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"]
  });
}

const nativeContext = browser.contexts()[0];
const nativePage = requestedRuntime === "webview2"
  ? nativeContext?.pages()[0]
  : null;
if (requestedRuntime === "webview2" && !nativePage) {
  throw new Error("The attached WebView2 process exposed no application page.");
}

async function newAuditPage() {
  if (requestedRuntime === "webview2") return nativePage;
  return browser.newPage();
}

async function closeAuditPage(page) {
  if (requestedRuntime !== "webview2") await page.close();
}

async function auditPlayback(page, auditCase, timeoutMilliseconds = 25_000) {
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.evaluate((url) => window.startPlaybackAudit(url), auditCase.url);
  const startedAt = Date.now();
  let state = null;
  while (Date.now() - startedAt < timeoutMilliseconds) {
    state = await page.evaluate(() => window.readPlaybackAudit());
    const advanced = state.firstPlayingTime !== null
      && state.lastPlayingTime !== null
      && state.lastPlayingTime - state.firstPlayingTime >= 1.25;
    if (state.ready && state.playerState === 1 && advanced) {
      return {
        ...auditCase,
        pass: true,
        state,
        elapsedMilliseconds: Date.now() - startedAt
      };
    }
    if (state.errorCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return {
    ...auditCase,
    pass: false,
    state,
    elapsedMilliseconds: Date.now() - startedAt
  };
}

let exitCode = 0;
try {
  console.log(JSON.stringify({
    scope: `real ${requestedRuntime === "webview2" ? "Windows WebView2" : "Chromium"} playback`,
    runtime: requestedRuntime,
    productionMedia: auditCases.length,
    proof: "YouTube iframe onReady, PLAYING state and at least 1.25 seconds of currentTime advancement"
  }));

  const calibrationPage = await newAuditPage();
  const invalidMedia = {
    ...auditCases[0].media,
    id: "youtube-invalid-calibration",
    providerId: "AAAAAAAAAAA"
  };
  const invalidUrl = buildPrivacyEmbedUrl(invalidMedia, { origin });
  if (!invalidUrl) throw new Error("Invalid calibration URL could not be constructed.");
  const invalid = await auditPlayback(calibrationPage, {
    media: invalidMedia,
    placement: { lessonId: "INVALID-CALIBRATION", startSeconds: 0 },
    url: invalidUrl
  }, 12_000);
  const knownGood = await auditPlayback(calibrationPage, auditCases[0]);
  await closeAuditPage(calibrationPage);
  if (invalid.pass || !knownGood.pass) {
    throw new Error(`Playback detector calibration failed: ${JSON.stringify({
      invalid: { pass: invalid.pass, state: invalid.state },
      knownGood: { pass: knownGood.pass, state: knownGood.state }
    })}`);
  }
  console.log(JSON.stringify({
    calibration: "PASS",
    invalidRejected: true,
    knownGoodAdvanced: true,
    knownGoodMediaId: knownGood.media.id
  }));

  const results = new Array(auditCases.length);
  let nextIndex = 0;
  const workerCount = requestedRuntime === "webview2" ? 1 : 4;
  const workers = Array.from({ length: workerCount }, async (_unused, workerIndex) => {
    const page = await newAuditPage();
    while (nextIndex < auditCases.length) {
      const index = nextIndex;
      nextIndex += 1;
      let result = await auditPlayback(page, auditCases[index]);
      if (!result.pass) result = await auditPlayback(page, auditCases[index]);
      results[index] = result;
      console.log(JSON.stringify({
        index: index + 1,
        total: auditCases.length,
        worker: workerIndex + 1,
        mediaId: result.media.id,
        lessonId: result.placement.lessonId,
        firstPlayingTime: result.state?.firstPlayingTime ?? null,
        lastPlayingTime: result.state?.lastPlayingTime ?? null,
        errorCode: result.state?.errorCode ?? null,
        elapsedMilliseconds: result.elapsedMilliseconds,
        result: result.pass ? "PLAYBACK PASS" : "FAIL"
      }));
    }
    await closeAuditPage(page);
  });
  await Promise.all(workers);
  const failed = results.filter((result) => !result.pass);
  console.log(JSON.stringify({
    status: failed.length === 0
      ? `${requestedRuntime.toLocaleUpperCase("en-AU")}_PLAYBACK_PASS`
      : "FAIL",
    productionMedia: auditCases.length,
    passed: results.length - failed.length,
    failed: failed.map((result) => ({
      mediaId: result.media.id,
      lessonId: result.placement.lessonId,
      state: result.state
    }))
  }, null, 2));
  if (failed.length > 0) exitCode = 1;
} finally {
  await browser.close();
  if (nativeProcess?.exitCode === null) nativeProcess.kill();
  await vite.close();
  await new Promise((resolve, reject) => server.close((error) => (
    error ? reject(error) : resolve()
  )));
}

process.exitCode = exitCode;
