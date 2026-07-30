import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { loadAllAcademyStages } from "../lib/academy/curriculum";

const readWorkspaceFile = (relativePath: string): string =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

interface OfflineManifestFixture {
  boundary: string;
  assets: string[];
  coverage: {
    lessonIds: string[];
    routeEntries: Array<{ source: string; file: string }>;
    stageEntries: Array<{ source: string; file: string }>;
  };
}

function validOfflineManifest(): OfflineManifestFixture {
  const lessonIds = Array.from({ length: 25 }, (_, unitIndex) => {
    const unitNumber = unitIndex + 1;
    const stage = unitNumber <= 3
      ? "E0"
      : unitNumber <= 8
        ? "E1"
        : unitNumber <= 16
          ? "E2"
          : unitNumber <= 23
            ? "E3"
            : "E4";
    return Array.from({ length: 7 }, (_, lessonIndex) =>
      `EML-${stage}-D${String(unitNumber).padStart(2, "0")}-L${String(lessonIndex + 1).padStart(2, "0")}`
    );
  }).flat();
  const sharedEntry = "assets/academy-runtime.js";
  return {
    boundary: "academy-native-v1",
    assets: [
      "index.html",
      "academy-service-worker.js",
      "theme-bootstrap.js",
      "favicon.svg",
      sharedEntry
    ],
    coverage: {
      lessonIds,
      routeEntries: Array.from({ length: 8 }, (_, index) => ({
        source: `src/pages/AcademyFixture${index + 1}.tsx`,
        file: sharedEntry
      })),
      stageEntries: ["E0", "E1", "E2", "E3", "E4"].map((stage) => ({
        source: `src/data/academy/stages/${stage}.ts`,
        file: sharedEntry
      }))
    }
  };
}

type ServiceWorkerHandler = (event: {
  request?: unknown;
  respondWith?: (response: Promise<Response>) => void;
  waitUntil?: (work: Promise<unknown>) => void;
}) => void;

function requestUrl(request: unknown): string {
  if (typeof request === "string") return request;
  if (
    request !== null
    && typeof request === "object"
    && "url" in request
    && typeof request.url === "string"
  ) {
    return request.url;
  }
  throw new Error("Test request has no URL.");
}

function createServiceWorkerRuntime(manifest: OfflineManifestFixture) {
  const scope = "https://academy.test/Engineering-Mastery-Lab/";
  const handlers = new Map<string, ServiceWorkerHandler>();
  const stores = new Map<string, Map<string, Response>>();
  const offlineUrls = new Set<string>();
  const networkRequests: string[] = [];

  const fetchMock = async (input: unknown): Promise<Response> => {
    const url = requestUrl(input);
    networkRequests.push(url);
    if (offlineUrls.has(url)) throw new TypeError("Network unavailable");
    if (url === `${scope}academy-offline-assets.json`) {
      return new Response(JSON.stringify(manifest), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    return new Response(`network:${url}`, { status: 200 });
  };

  const cacheFor = (cacheName: string) => {
    let store = stores.get(cacheName);
    if (!store) {
      store = new Map();
      stores.set(cacheName, store);
    }
    return {
      addAll: async (requests: string[]) => {
        const responses = await Promise.all(
          requests.map(async (request) => [request, await fetchMock(request)] as const)
        );
        for (const [request, response] of responses) {
          store?.set(requestUrl(request), response.clone());
        }
      },
      match: async (request: unknown) =>
        store?.get(requestUrl(request))?.clone(),
      put: async (request: unknown, response: Response) => {
        store?.set(requestUrl(request), response.clone());
      }
    };
  };
  const globalCacheMatch = async () => {
    throw new Error("Global caches.match must never be used.");
  };
  const cachesMock = {
    open: async (cacheName: string) => cacheFor(cacheName),
    keys: async () => [...stores.keys()],
    delete: async (cacheName: string) => stores.delete(cacheName),
    match: globalCacheMatch
  };
  const selfMock = {
    registration: { scope },
    location: { origin: new URL(scope).origin },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener: (type: string, handler: ServiceWorkerHandler) => {
      handlers.set(type, handler);
    }
  };

  runInNewContext(
    readWorkspaceFile("../../public/academy-service-worker.js"),
    {
      caches: cachesMock,
      fetch: fetchMock,
      self: selfMock,
      URL,
      Set,
      Promise,
      Error,
      TypeError
    },
    { filename: "academy-service-worker.js" }
  );

  const dispatchInstall = async () => {
    let work: Promise<unknown> | undefined;
    handlers.get("install")?.({
      waitUntil: (pending) => {
        work = pending;
      }
    });
    if (!work) throw new Error("Install handler did not call waitUntil.");
    await work;
  };
  const dispatchFetch = async (
    url: string,
    mode: "cors" | "navigate" = "cors"
  ): Promise<Response | null> => {
    let response: Promise<Response> | undefined;
    handlers.get("fetch")?.({
      request: {
        url,
        method: "GET",
        mode,
        headers: new Headers()
      },
      respondWith: (pending) => {
        response = pending;
      }
    });
    return response ? await response : null;
  };

  return {
    dispatchFetch,
    dispatchInstall,
    networkRequests,
    offlineUrls,
    scope,
    stores
  };
}

describe("academy offline boundary", () => {
  it("registers only the scoped production web service worker", () => {
    const source = readWorkspaceFile("../lib/academy/offline.ts");

    expect(source).toContain("import.meta.env.PROD");
    expect(source).toContain('"__TAURI_INTERNALS__" in window');
    expect(source).toContain("import.meta.env.BASE_URL");
    expect(source).not.toMatch(/https?:\/\/[^\s"']+/);
  });

  it("caches only bounded same-origin Academy assets with complete coverage", () => {
    const source = readWorkspaceFile("../../public/academy-service-worker.js");

    expect(source).toContain("url.origin !== self.location.origin");
    expect(source).toContain('request.method !== "GET"');
    expect(source).toContain("manifest.assets.length > 256");
    expect(source).toContain('manifest.boundary !== "academy-native-v1"');
    expect(source).toContain("EXPECTED_LESSON_COUNT = 175");
    expect(source).toContain('assetSet.has("index.html")');
    expect(source).toContain("manifest.coverage.stageEntries");
    expect(source).toContain("__ACADEMY_OFFLINE_VERSION__");
    expect(source).toContain("ignoreVary: true");
    expect(source).toContain("SAFE_ASSET_PATH");
    expect(source).toContain('asset.includes("..")');
    expect(source).toContain('asset.includes(":")');
    expect(source).toContain('asset.includes("\\\\")');
    expect(source).toContain("resolved.origin !== SCOPE_URL.origin");
    expect(source).toContain("allowedAssets.has(requestUrl)");
    expect(source).not.toContain("caches.match");
    expect(source).not.toContain("youtube");
    expect(source).not.toContain("youtube-nocookie");
  });

  it("enforces reviewed membership and named-cache isolation at runtime", async () => {
    const runtime = createServiceWorkerRuntime(validOfflineManifest());
    await runtime.dispatchInstall();

    const cacheName = [...runtime.stores.keys()].find((name) =>
      name.startsWith("engineering-mastery-lab-academy-")
    );
    expect(cacheName).toBeDefined();
    const namedCache = runtime.stores.get(cacheName ?? "");
    expect(namedCache).toBeDefined();
    expect(namedCache?.has(`${runtime.scope}academy-offline-assets.json`)).toBe(true);
    expect(namedCache?.has(`${runtime.scope}index.html`)).toBe(true);

    const reviewedUrl = `${runtime.scope}assets/academy-runtime.js`;
    namedCache?.delete(reviewedUrl);
    const reviewedResponse = await runtime.dispatchFetch(reviewedUrl);
    expect(await reviewedResponse?.text()).toBe(`network:${reviewedUrl}`);
    expect(namedCache?.has(reviewedUrl)).toBe(true);

    const rogueUrl = `${runtime.scope}unreviewed.json`;
    const rogueResponse = await runtime.dispatchFetch(rogueUrl);
    expect(await rogueResponse?.text()).toBe(`network:${rogueUrl}`);
    expect(namedCache?.has(rogueUrl)).toBe(false);

    const onlineNavigation = `${runtime.scope}learn/academy/lesson-online`;
    const onlineResponse = await runtime.dispatchFetch(onlineNavigation, "navigate");
    expect(await onlineResponse?.text()).toBe(`network:${onlineNavigation}`);
    expect(namedCache?.has(onlineNavigation)).toBe(false);

    const offlineNavigation = `${runtime.scope}learn/academy/lesson-offline`;
    runtime.stores.set("unrelated-cache", new Map([
      [`${runtime.scope}index.html`, new Response("poisoned-other-cache")]
    ]));
    runtime.offlineUrls.add(offlineNavigation);
    const offlineResponse = await runtime.dispatchFetch(offlineNavigation, "navigate");
    expect(await offlineResponse?.text()).toBe(`network:${runtime.scope}index.html`);
    expect(namedCache?.has(offlineNavigation)).toBe(false);
    expect(runtime.networkRequests).toContain(rogueUrl);
  });

  it.each([
    "\\\\evil.example/x",
    "%2e%2e/secret"
  ])("rejects unsafe manifest path %s before caching assets", async (unsafePath) => {
    const manifest = validOfflineManifest();
    manifest.assets.push(unsafePath);
    const runtime = createServiceWorkerRuntime(manifest);

    await expect(runtime.dispatchInstall()).rejects.toThrow(
      /unsafe asset path|outside the registered scope/u
    );
    const namedCache = [...runtime.stores.entries()].find(([name]) =>
      name.startsWith("engineering-mastery-lab-academy-")
    )?.[1];
    expect(namedCache?.has(`${runtime.scope}${unsafePath}`)).not.toBe(true);
  });

  it("keeps static shell imports and Academy dynamics while excluding CAD and Three.js", async () => {
    const builderUrl = new URL(
      "../../scripts/build-academy-offline-manifest.mjs",
      import.meta.url
    ).href;
    const {
      collectViteGraph,
      containsThreeRuntime,
      extractAcademyLessonIds
    } = await import(builderUrl) as {
      collectViteGraph: (
        manifest: Record<string, {
          file: string;
          imports?: string[];
          dynamicImports?: string[];
        }>,
        roots: Array<{ key: string; includeDynamicImports: boolean }>,
        options?: { dynamicImportBoundaries?: string[] }
      ) => { assets: string[]; manifestKeys: string[] };
      containsThreeRuntime: (source: string) => boolean;
      extractAcademyLessonIds: (profileSources: string[]) => string[];
    };
    const manifest = {
      "index.html": {
        file: "assets/index.js",
        imports: ["_shared.js"],
        dynamicImports: [
          "src/pages/AcademyLessonPage.tsx",
          "src/pages/CadStudioPage.tsx"
        ]
      },
      "_shared.js": { file: "assets/shared.js" },
      "src/pages/AcademyLessonPage.tsx": {
        file: "assets/AcademyLessonPage.js",
        imports: ["_academy.js", "index.html"],
        dynamicImports: ["src/data/academy/stages/E0.ts"]
      },
      "_academy.js": { file: "assets/academy-authoring.js" },
      "src/data/academy/stages/E0.ts": { file: "assets/E0.js" },
      "src/pages/CadStudioPage.tsx": {
        file: "assets/CadStudioPage.js",
        imports: ["_three.js", "index.html"]
      },
      "_three.js": { file: "assets/three.js" }
    };

    const shell = collectViteGraph(manifest, [{
      key: "index.html",
      includeDynamicImports: false
    }]);
    const academy = collectViteGraph(manifest, [{
      key: "src/pages/AcademyLessonPage.tsx",
      includeDynamicImports: true
    }], { dynamicImportBoundaries: ["index.html"] });
    const assets = [...new Set([...shell.assets, ...academy.assets])];

    expect(assets).toEqual(expect.arrayContaining([
      "assets/index.js",
      "assets/shared.js",
      "assets/AcademyLessonPage.js",
      "assets/academy-authoring.js",
      "assets/E0.js"
    ]));
    expect(assets).not.toContain("assets/CadStudioPage.js");
    expect(assets).not.toContain("assets/three.js");
    expect(containsThreeRuntime("const warning = 'THREE.WebGLRenderer:';")).toBe(true);
    expect(containsThreeRuntime("Three dimensional lesson visual")).toBe(false);
    expect(extractAcademyLessonIds([
      "const lessonIdsForUnit = (unitId) => Array.from({ length: 7 }, (_, index) => `${unitId}-L${index + 1}`);"
    ])).toEqual([]);
  });

  it("represents all 175 native written lessons and their guided practice in E0-E4", async () => {
    const builderUrl = new URL(
      "../../scripts/build-academy-offline-manifest.mjs",
      import.meta.url
    ).href;
    const { extractAcademyLessonIds } = await import(builderUrl) as {
      extractAcademyLessonIds: (profileSources: string[]) => string[];
    };
    const profileSources = ["E0", "E1", "E2", "E3", "E4"].map((stage) =>
      readWorkspaceFile(`../data/academy/lessonTeachingProfiles/${stage}.ts`)
    );
    const stages = await loadAllAcademyStages();
    const lessons = stages.flatMap((stage) => stage.lessons);

    expect(stages.map((stage) => stage.stage)).toEqual(["E0", "E1", "E2", "E3", "E4"]);
    expect(lessons).toHaveLength(175);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(175);
    expect(extractAcademyLessonIds(profileSources)).toEqual(
      lessons.map((lesson) => lesson.id).sort((left, right) => left.localeCompare(right))
    );
    for (const lesson of lessons) {
      expect(
        lesson.blocks.some((block) => block.kind === "practice-set"),
        `${lesson.id} is missing native guided practice`
      ).toBe(true);
      expect(lesson.questions.length, `${lesson.id} question coverage`).toBeGreaterThanOrEqual(4);
      for (const question of lesson.questions) {
        expect(question.hints.length, `${question.id} hint coverage`).toBeGreaterThanOrEqual(2);
        expect(question.solution.length, `${question.id} solution coverage`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
