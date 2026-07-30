import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "..");
const distributionRoot = resolve(workspaceRoot, "dist");
const viteManifestPath = resolve(distributionRoot, ".vite", "manifest.json");
const outputName = "academy-offline-assets.json";
const versionPlaceholder = "__ACADEMY_OFFLINE_VERSION__";
const expectedLessonCount = 175;
const expectedStages = ["E0", "E1", "E2", "E3", "E4"];
const academyShellSources = [
  "src/pages/Home.tsx",
  "src/pages/LearnHub.tsx"
];
const requiredShellAssets = [
  "index.html",
  "academy-service-worker.js",
  "theme-bootstrap.js",
  "favicon.svg"
];
const publicAssetPattern =
  /(?:^|["'`(])(?:\.\/)?(assets\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:avif|gif|jpe?g|png|svg|webp|woff2?|ttf|otf))(?:["'`)?},;\s]|$)/giu;
const barePublicAssetPattern =
  /(?:^|["'`(])([A-Za-z0-9][A-Za-z0-9._-]*\.(?:avif|gif|jpe?g|png|svg|webp|woff2?|ttf|otf))(?:["'`)?},;\s]|$)/giu;

function normalisePath(path) {
  return path.split("\\").join("/");
}

function assertSafeAssetPath(asset) {
  if (
    typeof asset !== "string"
    || asset.length === 0
    || asset.length > 240
    || asset.includes("..")
    || asset.includes(":")
    || asset.startsWith("/")
    || asset.includes("\\")
  ) {
    throw new Error(`Academy offline graph contains unsafe asset path: ${String(asset)}`);
  }
  return asset;
}

function manifestSource(record, key) {
  return normalisePath(typeof record.src === "string" ? record.src : key);
}

function sourceKey(manifest, source) {
  const normalisedSource = normalisePath(source);
  const matches = Object.entries(manifest)
    .filter(([key, record]) => manifestSource(record, key) === normalisedSource)
    .map(([key]) => key);
  if (matches.length !== 1) {
    throw new Error(
      `Academy offline graph expected one Vite manifest entry for ${normalisedSource}, found ${matches.length}.`
    );
  }
  return matches[0];
}

function recordAssets(record) {
  const assets = [];
  if (typeof record.file === "string") assets.push(record.file);
  if (Array.isArray(record.css)) assets.push(...record.css);
  if (Array.isArray(record.assets)) assets.push(...record.assets);
  return assets.map((asset) => assertSafeAssetPath(normalisePath(asset)));
}

export function collectViteGraph(
  manifest,
  roots,
  { dynamicImportBoundaries = [] } = {}
) {
  const assets = new Set();
  const visitedDepth = new Map();
  const dynamicBoundaries = new Set(dynamicImportBoundaries);
  const queue = roots.map(({ key, includeDynamicImports }) => ({
    key,
    includeDynamicImports: Boolean(includeDynamicImports)
  }));

  while (queue.length > 0) {
    const current = queue.shift();
    const includeDynamicImports =
      current.includeDynamicImports && !dynamicBoundaries.has(current.key);
    const previousDepth = visitedDepth.get(current.key) ?? -1;
    const requestedDepth = includeDynamicImports ? 1 : 0;
    if (previousDepth >= requestedDepth) continue;
    visitedDepth.set(current.key, requestedDepth);

    const record = manifest[current.key];
    if (!record || typeof record !== "object") {
      throw new Error(`Academy offline graph references missing Vite entry: ${current.key}`);
    }
    for (const asset of recordAssets(record)) assets.add(asset);

    for (const importedKey of record.imports ?? []) {
      if (typeof importedKey !== "string" || !(importedKey in manifest)) {
        throw new Error(`Academy offline graph has unresolved static import from ${current.key}.`);
      }
      queue.push({
        key: importedKey,
        includeDynamicImports
      });
    }
    if (includeDynamicImports) {
      for (const importedKey of record.dynamicImports ?? []) {
        if (typeof importedKey !== "string" || !(importedKey in manifest)) {
          throw new Error(`Academy offline graph has unresolved dynamic import from ${current.key}.`);
        }
        queue.push({ key: importedKey, includeDynamicImports: true });
      }
    }
  }

  return {
    assets: [...assets].sort((left, right) => left.localeCompare(right)),
    manifestKeys: [...visitedDepth.keys()].sort((left, right) => left.localeCompare(right))
  };
}

export function extractAcademyRouteSources(appSource) {
  const routeSources = new Set();
  const importPattern = /import\("\.\/pages\/([A-Za-z0-9]+)"\)/gu;
  for (const match of appSource.matchAll(importPattern)) {
    const page = match[1];
    if (
      page.startsWith("Academy")
      || page === "CurriculumDiagnosticsPage"
      || page === "CurriculumResourcesPage"
    ) {
      routeSources.add(`src/pages/${page}.tsx`);
    }
  }
  return [...routeSources].sort((left, right) => left.localeCompare(right));
}

export function extractAcademyStageSources(curriculumSource) {
  const stageSources = new Set();
  const importPattern =
    /import\("\.\.\/\.\.\/data\/academy\/stages\/(E[0-4])"\)/gu;
  for (const match of curriculumSource.matchAll(importPattern)) {
    stageSources.add(`src/data/academy/stages/${match[1]}.ts`);
  }
  return [...stageSources].sort((left, right) => left.localeCompare(right));
}

export function extractAcademyLessonIds(profileSources) {
  if (!Array.isArray(profileSources)) {
    throw new Error("Academy lesson coverage requires the five teaching-profile sources.");
  }
  const lessonIds = [];
  const profileKeyPattern =
    /^\s*"(EML-E[0-4]-D\d{2}-L\d{2})"\s*:\s*\{/gmu;
  for (const profileSource of profileSources) {
    if (typeof profileSource !== "string") {
      throw new Error("Academy teaching-profile source must be text.");
    }
    lessonIds.push(
      ...[...profileSource.matchAll(profileKeyPattern)].map((match) => match[1])
    );
  }
  const uniqueLessonIds = new Set(lessonIds);
  if (uniqueLessonIds.size !== lessonIds.length) {
    throw new Error("Academy teaching-profile sources contain duplicate lesson IDs.");
  }
  return [...uniqueLessonIds].sort((left, right) => left.localeCompare(right));
}

function filterSupersededPngAssets(assets, availableFiles) {
  return assets.filter((asset) => {
    if (!asset.toLocaleLowerCase("en-AU").endsWith(".png")) return true;
    const webp = `${asset.slice(0, -4)}.webp`;
    return !(assets.includes(webp) && availableFiles.has(webp));
  });
}

async function collectReferencedPublicAssets(graphAssets) {
  const referencedAssets = new Set();
  const availableFiles = new Set();

  for (const asset of graphAssets) {
    const absolutePath = resolve(distributionRoot, asset);
    if (![".css", ".html", ".js"].includes(
      asset.slice(asset.lastIndexOf(".")).toLocaleLowerCase("en-AU")
    )) {
      continue;
    }
    const source = await readFile(absolutePath, "utf8");
    for (const match of source.matchAll(publicAssetPattern)) {
      referencedAssets.add(assertSafeAssetPath(match[1]));
    }
    for (const match of source.matchAll(barePublicAssetPattern)) {
      const candidate = assertSafeAssetPath(`assets/${match[1]}`);
      try {
        const metadata = await stat(resolve(distributionRoot, candidate));
        if (metadata.isFile() && metadata.size > 0) {
          referencedAssets.add(candidate);
        }
      } catch {
        // A filename-like string is not a build asset unless it resolves inside dist.
      }
    }
  }

  for (const asset of referencedAssets) {
    try {
      const metadata = await stat(resolve(distributionRoot, asset));
      if (metadata.isFile() && metadata.size > 0) availableFiles.add(asset);
    } catch {
      throw new Error(`Academy offline graph references missing local asset: ${asset}`);
    }
  }

  return filterSupersededPngAssets([...referencedAssets], availableFiles)
    .sort((left, right) => left.localeCompare(right));
}

function entryCoverage(manifest, sources) {
  return sources.map((source) => {
    const key = sourceKey(manifest, source);
    const file = assertSafeAssetPath(normalisePath(manifest[key].file));
    return { source, file };
  });
}

function assertExpectedCoverage(routeSources, stageSources, lessonIds) {
  if (routeSources.length < 8) {
    throw new Error(
      `Academy offline graph found only ${routeSources.length} Academy route entries.`
    );
  }
  const stages = stageSources.map((source) =>
    source.match(/\/(E[0-4])\.ts$/u)?.[1]
  );
  if (
    stages.length !== expectedStages.length
    || expectedStages.some((stage) => !stages.includes(stage))
  ) {
    throw new Error("Academy offline graph must include exactly the E0-E4 stage entries.");
  }
  if (lessonIds.length !== expectedLessonCount) {
    throw new Error(
      `Academy offline graph expected ${expectedLessonCount} written lessons, found ${lessonIds.length}.`
    );
  }
}

async function assertDistributionAssets(assets) {
  for (const asset of assets) {
    const metadata = await stat(resolve(distributionRoot, asset));
    if (!metadata.isFile() || metadata.size <= 0) {
      throw new Error(`Academy offline asset is missing or empty: ${asset}`);
    }
  }
}

export function containsThreeRuntime(source) {
  return source.includes("THREE.") && source.includes("WebGLRenderer:");
}

export async function buildAcademyOfflineManifest() {
  const [
    viteManifestSource,
    appSource,
    curriculumSource,
    ...profileSources
  ] =
    await Promise.all([
      readFile(viteManifestPath, "utf8"),
      readFile(resolve(workspaceRoot, "src", "App.tsx"), "utf8"),
      readFile(resolve(workspaceRoot, "src", "lib", "academy", "curriculum.ts"), "utf8"),
      ...expectedStages.map((stage) =>
        readFile(
          resolve(
            workspaceRoot,
            "src",
            "data",
            "academy",
            "lessonTeachingProfiles",
            `${stage}.ts`
          ),
          "utf8"
        )
      )
    ]);
  const viteManifest = JSON.parse(viteManifestSource);
  const routeSources = extractAcademyRouteSources(appSource);
  const stageSources = extractAcademyStageSources(curriculumSource);
  for (let index = 0; index < profileSources.length; index += 1) {
    const stage = expectedStages[index];
    const stageLessonIds = extractAcademyLessonIds([profileSources[index]]);
    if (
      stageLessonIds.length === 0
      || stageLessonIds.some((lessonId) => !lessonId.startsWith(`EML-${stage}-`))
    ) {
      throw new Error(
        `Academy teaching-profile source ${stage} has missing or cross-stage lesson IDs.`
      );
    }
  }
  const lessonIds = extractAcademyLessonIds(profileSources);
  assertExpectedCoverage(routeSources, stageSources, lessonIds);

  const shellRoot = sourceKey(viteManifest, "index.html");
  const academySources = [
    ...academyShellSources,
    ...routeSources,
    ...stageSources
  ];
  const academyRootKeys = academySources.map((source) => sourceKey(viteManifest, source));
  const shellGraph = collectViteGraph(viteManifest, [{
    key: shellRoot,
    includeDynamicImports: false
  }]);
  const academyGraph = collectViteGraph(viteManifest, academyRootKeys.map((key) => ({
    key,
    includeDynamicImports: true
  })), { dynamicImportBoundaries: [shellRoot] });
  const graphAssets = [...new Set([
    ...shellGraph.assets,
    ...academyGraph.assets
  ])];
  const publicAssets = await collectReferencedPublicAssets([
    ...graphAssets,
    "index.html"
  ]);
  const assets = [...new Set([
    ...requiredShellAssets,
    ...graphAssets,
    ...publicAssets
  ])].map(assertSafeAssetPath)
    .sort((left, right) => left.localeCompare(right));

  const cadSource = "src/pages/CadStudioPage.tsx";
  const cadKey = sourceKey(viteManifest, cadSource);
  const cadEntryFile = assertSafeAssetPath(normalisePath(viteManifest[cadKey].file));
  if (assets.includes(cadEntryFile)) {
    throw new Error(
      `Academy offline graph includes the CAD route entry: ${cadEntryFile}`
    );
  }
  const selectedThreeRuntimeAssets = [];
  for (const asset of assets.filter((asset) => asset.endsWith(".js"))) {
    const source = await readFile(resolve(distributionRoot, asset), "utf8");
    if (containsThreeRuntime(source)) selectedThreeRuntimeAssets.push(asset);
  }
  if (selectedThreeRuntimeAssets.length > 0) {
    throw new Error(
      `Academy offline graph includes Three.js runtime code: ${selectedThreeRuntimeAssets.join(", ")}`
    );
  }

  const nonAcademyDynamicEntries = (viteManifest[shellRoot].dynamicImports ?? [])
    .filter((key) => !academyRootKeys.includes(key));
  const nonAcademyEntryFiles = new Set(
    nonAcademyDynamicEntries
      .map((key) => viteManifest[key]?.file)
      .filter((file) => typeof file === "string")
  );
  const unrelatedEntries = assets.filter((asset) => nonAcademyEntryFiles.has(asset));
  if (unrelatedEntries.length > 0) {
    throw new Error(
      `Academy offline graph includes unrelated route entries: ${unrelatedEntries.join(", ")}`
    );
  }
  if (assets.some((asset) => asset.toLocaleLowerCase("en-AU").endsWith(".png"))) {
    throw new Error("Academy offline graph still contains superseded PNG artwork.");
  }

  await assertDistributionAssets(assets);
  const coverage = {
    lessonIds,
    routeEntries: entryCoverage(viteManifest, routeSources),
    shellEntries: entryCoverage(viteManifest, academyShellSources),
    stageEntries: entryCoverage(viteManifest, stageSources)
  };

  const versionHash = createHash("sha256");
  versionHash.update(JSON.stringify(coverage));
  for (const asset of assets) {
    versionHash.update(asset);
    versionHash.update(await readFile(resolve(distributionRoot, asset)));
  }
  const version = `2026.07.30-${versionHash.digest("hex").slice(0, 12)}`;
  const serviceWorkerPath = resolve(distributionRoot, "academy-service-worker.js");
  const serviceWorkerSource = await readFile(serviceWorkerPath, "utf8");
  if (!serviceWorkerSource.includes(versionPlaceholder)) {
    throw new Error("Offline service worker version placeholder is missing.");
  }
  await writeFile(
    serviceWorkerPath,
    serviceWorkerSource.replaceAll(versionPlaceholder, version),
    "utf8"
  );

  const manifest = {
    version,
    boundary: "academy-native-v1",
    assets,
    coverage
  };
  await writeFile(
    resolve(distributionRoot, outputName),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  const totalBytes = (await Promise.all(
    assets.map(async (asset) => (await stat(resolve(distributionRoot, asset))).size)
  )).reduce((sum, size) => sum + size, 0);
  console.log(
    `Academy offline manifest: ${assets.length} assets, ${lessonIds.length} lessons, ${totalBytes} uncompressed bytes, ${version}.`
  );
  return { manifest, totalBytes };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await buildAcademyOfflineManifest();
}
