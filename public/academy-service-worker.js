const CACHE_PREFIX = "engineering-mastery-lab-academy-";
const CACHE_NAME = `${CACHE_PREFIX}__ACADEMY_OFFLINE_VERSION__`;
const MANIFEST_NAME = "academy-offline-assets.json";
const EXPECTED_LESSON_COUNT = 175;
const EXPECTED_STAGES = ["E0", "E1", "E2", "E3", "E4"];
const SAFE_ASSET_PATH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;
const SCOPE_URL = new URL(self.registration.scope);
let reviewedAssetSetPromise = null;

function scopedUrl(path) {
  const resolved = new URL(path, SCOPE_URL);
  if (
    resolved.origin !== SCOPE_URL.origin
    || !resolved.href.startsWith(SCOPE_URL.href)
    || resolved.search !== ""
    || resolved.hash !== ""
  ) {
    throw new Error("Offline asset resolves outside the registered scope.");
  }
  return resolved.toString();
}

async function reviewedAssetUrls() {
  const cache = await caches.open(CACHE_NAME);
  const manifestUrl = scopedUrl(MANIFEST_NAME);
  let response = null;
  try {
    const networkResponse = await fetch(manifestUrl, { cache: "no-store" });
    if (networkResponse.ok) response = networkResponse;
  } catch {
    // A previously validated manifest may be used while genuinely offline.
  }
  if (!response) {
    response = await cache.match(manifestUrl, { ignoreVary: true });
  }
  if (!response?.ok) {
    throw new Error("Offline manifest is unavailable.");
  }
  const manifest = await response.clone().json();
  if (
    manifest === null
    || typeof manifest !== "object"
    || manifest.boundary !== "academy-native-v1"
    || !Array.isArray(manifest.assets)
    || manifest.assets.length === 0
    || manifest.assets.length > 256
    || manifest.coverage === null
    || typeof manifest.coverage !== "object"
    || !Array.isArray(manifest.coverage.lessonIds)
    || manifest.coverage.lessonIds.length !== EXPECTED_LESSON_COUNT
    || new Set(manifest.coverage.lessonIds).size !== EXPECTED_LESSON_COUNT
    || !Array.isArray(manifest.coverage.routeEntries)
    || manifest.coverage.routeEntries.length < 8
    || !Array.isArray(manifest.coverage.stageEntries)
    || manifest.coverage.stageEntries.length !== EXPECTED_STAGES.length
  ) {
    throw new Error("Offline manifest is malformed.");
  }
  const assets = manifest.assets.map((asset) => {
    if (
      typeof asset !== "string"
      || asset.length === 0
      || asset.length > 240
      || !SAFE_ASSET_PATH.test(asset)
      || asset.includes("..")
      || asset.includes(":")
      || asset.startsWith("/")
      || asset.includes("\\")
      || asset.split("/").some((segment) => segment.length === 0 || segment === ".")
    ) {
      throw new Error("Offline manifest contains an unsafe asset path.");
    }
    const resolved = scopedUrl(asset);
    const resolvedUrl = new URL(resolved);
    if (
      resolvedUrl.origin !== self.location.origin
      || !resolved.startsWith(SCOPE_URL.href)
    ) {
      throw new Error("Offline manifest asset escapes the application scope.");
    }
    return resolved;
  });
  const assetSet = new Set(manifest.assets);
  if (
    assetSet.size !== manifest.assets.length
    || !assetSet.has("index.html")
    || !assetSet.has("academy-service-worker.js")
    || manifest.coverage.lessonIds.some((lessonId) =>
      typeof lessonId !== "string"
      || !/^EML-E[0-4]-D\d{2}-L\d{2}$/u.test(lessonId)
    )
    || manifest.coverage.routeEntries.some((entry) =>
      entry === null
      || typeof entry !== "object"
      || typeof entry.source !== "string"
      || !entry.source.startsWith("src/pages/")
      || typeof entry.file !== "string"
      || !assetSet.has(entry.file)
    )
    || EXPECTED_STAGES.some((stage) =>
      !manifest.coverage.stageEntries.some((entry) =>
        entry?.source === `src/data/academy/stages/${stage}.ts`
        && typeof entry.file === "string"
        && assetSet.has(entry.file)
      )
    )
  ) {
    throw new Error("Offline manifest coverage is incomplete.");
  }
  if (response.url !== "" && response.url !== manifestUrl) {
    throw new Error("Offline manifest response URL does not match the scoped manifest.");
  }
  await cache.put(manifestUrl, response.clone());
  return assets;
}

function reviewedAssetSet() {
  if (!reviewedAssetSetPromise) {
    reviewedAssetSetPromise = reviewedAssetUrls()
      .then((assets) => new Set([
        ...assets,
        scopedUrl(MANIFEST_NAME)
      ]))
      .catch((error) => {
        reviewedAssetSetPromise = null;
        throw error;
      });
  }
  return reviewedAssetSetPromise;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const assetUrls = await reviewedAssetUrls();
    reviewedAssetSetPromise = Promise.resolve(new Set([
      ...assetUrls,
      scopedUrl(MANIFEST_NAME)
    ]));
    await cache.addAll(assetUrls);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) =>
          cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME
        )
        .map((cacheName) => caches.delete(cacheName))
    );
    await self.clients.claim();
  })());
});

async function reviewedCacheFirst(request, allowedAssets) {
  const requestUrl = new URL(request.url).toString();
  if (!allowedAssets.has(requestUrl)) {
    return fetch(request);
  }
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationNetworkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const fallback = await cache.match(scopedUrl("index.html"), {
      ignoreVary: true
    });
    if (fallback) return fallback;
    throw new Error("The reviewed offline application shell is unavailable.");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET"
    || url.origin !== self.location.origin
    || request.headers.has("range")
  ) {
    return;
  }
  event.respondWith(
    request.mode === "navigate"
      ? navigationNetworkFirst(request)
      : reviewedAssetSet()
          .then((allowedAssets) => reviewedCacheFirst(request, allowedAssets))
          .catch(() => fetch(request))
  );
});
