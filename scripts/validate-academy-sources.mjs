import process from "node:process";
import { createServer } from "vite";

const requestTimeoutMilliseconds = 30_000;
const validationDate = "2026-07-30";
const expectedSourceCount = 65;
const expectedUnitCount = 25;
const prohibitedGenericUrls = new Set([
  "https://ocw.mit.edu/",
  "https://docs.python.org/3/",
  "https://isocpp.org/",
  "https://docs.ros.org/en/rolling/",
  "https://gazebosim.org/docs/",
  "https://docs.opencv.org/",
  "https://www.rfc-editor.org/rfc-index.html",
  "https://www.nist.gov/product-data",
  "https://www.nist.gov/programs-projects/materials-data-repository",
  "https://www.nist.gov/mep"
]);
const restrictedLinkOutSourceIds = [
  "SRC-AUTODESK-FUSION-CAD-90",
  "SRC-ASME-Y14-5",
  "SRC-ISA-101",
  "SRC-ISA-18",
  "SRC-OPC-UA-PART-1",
  "SRC-OMG-DDS-1-4",
  "SRC-FREERTOS-DEVELOPER-DOCS",
  "SRC-ENGINEERS-AUSTRALIA-STAGE-1",
  "SRC-ENGINEERS-AUSTRALIA-ETHICS"
];
const removedLegacySourceIds = new Set([
  "SRC-MIT-OCW",
  "SRC-PYTHON",
  "SRC-CPP",
  "SRC-NIST-STATISTICS",
  "SRC-STM32",
  "SRC-NASA-SE",
  "SRC-ROS2",
  "SRC-GAZEBO",
  "SRC-OPENCV",
  "SRC-SCIKIT"
]);
const moduleLoader = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  root: process.cwd(),
  server: {
    middlewareMode: true,
    hmr: false
  }
});
const {
  academyCourses,
  academySources,
  academyUnits,
  academyUnitSourceMap
} = await moduleLoader.ssrLoadModule(
  "/src/data/academy/catalogue.ts"
);

function assertAcademySourceRegistry() {
  const failures = [];
  const sourceIds = academySources.map((source) => source.id);
  const sourceUrls = academySources.map((source) => source.url);
  const unitIds = academyUnits.map((unit) => unit.id);
  const mappedUnitIds = Object.keys(academyUnitSourceMap);
  const mappedSourceIds = Object.values(academyUnitSourceMap).flat();
  const sourceById = new Map(academySources.map((source) => [source.id, source]));

  if (academySources.length !== expectedSourceCount) {
    failures.push(`Expected ${expectedSourceCount} source records, found ${academySources.length}.`);
  }
  if (new Set(sourceIds).size !== sourceIds.length) {
    failures.push("Source IDs are not unique.");
  }
  if (new Set(sourceUrls).size !== sourceUrls.length) {
    failures.push("Source URLs are not unique.");
  }
  if (mappedUnitIds.length !== expectedUnitCount) {
    failures.push(`Expected ${expectedUnitCount} unit source mappings, found ${mappedUnitIds.length}.`);
  }
  if (
    [...mappedUnitIds].sort().join("\n")
    !== [...unitIds].sort().join("\n")
  ) {
    failures.push("Unit source-map keys do not match the Academy unit catalogue.");
  }

  for (const source of academySources) {
    const requiredText = [
      ["title", source.title],
      ["organisation", source.organisation],
      ["licence", source.licence],
      ["attribution", source.attribution]
    ];
    for (const [field, value] of requiredText) {
      if (typeof value !== "string" || value.trim().length === 0) {
        failures.push(`${source.id} has no ${field}.`);
      }
    }
    if (source.optional !== true) {
      failures.push(`${source.id} must remain optional.`);
    }
    if (source.lastValidated !== validationDate) {
      failures.push(
        `${source.id} registry date ${source.lastValidated} does not match ${validationDate}.`
      );
    }
    if (prohibitedGenericUrls.has(source.url)) {
      failures.push(`${source.id} uses a prohibited generic homepage.`);
    }
    const declaredUrl = new URL(source.url);
    if (declaredUrl.protocol !== "https:") {
      failures.push(`${source.id} is not HTTPS.`);
    }
    const hostname = declaredUrl.hostname.toLocaleLowerCase("en-AU");
    if (hostname === "st.com" || hostname.endsWith(".st.com")) {
      failures.push(`${source.id} uses a prohibited ST deep link.`);
    }
  }

  for (const [unitId, mappedIds] of Object.entries(academyUnitSourceMap)) {
    if (mappedIds.length === 0) {
      failures.push(`${unitId} has no source records.`);
    }
    if (new Set(mappedIds).size !== mappedIds.length) {
      failures.push(`${unitId} repeats a source record.`);
    }
    for (const sourceId of mappedIds) {
      if (!sourceById.has(sourceId)) {
        failures.push(`${unitId} references missing source ${sourceId}.`);
      }
    }
  }

  for (const course of academyCourses) {
    if (course.sourceIds.length === 0) {
      failures.push(`${course.id} has no course-level source records.`);
    }
    for (const sourceId of course.sourceIds) {
      if (!sourceById.has(sourceId)) {
        failures.push(`${course.id} references missing source ${sourceId}.`);
      }
      if (removedLegacySourceIds.has(sourceId)) {
        failures.push(`${course.id} retains removed legacy source ${sourceId}.`);
      }
    }
  }

  const orphanSourceIds = [...new Set(sourceIds)]
    .filter((sourceId) => !mappedSourceIds.includes(sourceId));
  if (orphanSourceIds.length > 0) {
    failures.push(`Orphan source records: ${orphanSourceIds.join(", ")}.`);
  }

  for (const sourceId of restrictedLinkOutSourceIds) {
    if (!sourceById.get(sourceId)?.licence.startsWith("Link-out only;")) {
      failures.push(`${sourceId} is not marked link-out only.`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Academy source registry preflight failed:\n- ${failures.join("\n- ")}`);
  }
}

async function validateSource(source) {
  const declaredUrl = new URL(source.url);
  if (declaredUrl.protocol !== "https:") {
    throw new Error("Declared source URL is not HTTPS.");
  }
  if (source.lastValidated !== validationDate) {
    throw new Error(
      `Registry date ${source.lastValidated} does not match ${validationDate}.`
    );
  }

  const response = await fetch(declaredUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(requestTimeoutMilliseconds),
    headers: {
      Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
      "User-Agent": "Engineering-Mastery-Lab-Source-Validator/1.0"
    }
  });
  const finalUrl = new URL(response.url);
  await response.body?.cancel();

  if (!response.ok) {
    throw new Error(`Source returned HTTP ${response.status}.`);
  }
  if (finalUrl.protocol !== "https:") {
    throw new Error("Source redirected away from HTTPS.");
  }

  return {
    id: source.id,
    organisation: source.organisation,
    status: response.status,
    declaredHost: declaredUrl.hostname,
    finalHost: finalUrl.hostname,
    redirected: response.redirected,
    pass: true
  };
}

console.log(
  "Opt-in live validation: this command contacts every registered Academy source and checks its current HTTPS response."
);

try {
  assertAcademySourceRegistry();
  const settled = [];
  for (const source of academySources) {
    try {
      settled.push({
        status: "fulfilled",
        value: await validateSource(source)
      });
    } catch (reason) {
      settled.push({ status: "rejected", reason });
    }
  }
  const results = settled.map((entry, index) => {
    if (entry.status === "fulfilled") return entry.value;
    const source = academySources[index];
    return {
      id: source.id,
      organisation: source.organisation,
      status: null,
      declaredHost: new URL(source.url).hostname,
      finalHost: null,
      redirected: null,
      pass: false,
      error: entry.reason instanceof Error ? entry.reason.message : String(entry.reason)
    };
  });

  console.table(results.map((result) => ({
    id: result.id,
    organisation: result.organisation,
    status: result.status ?? "failed",
    declaredHost: result.declaredHost,
    finalHost: result.finalHost ?? "unavailable",
    redirected: result.redirected ?? "unknown",
    result: result.pass ? "PASS" : "FAIL"
  })));

  if (results.some((result) => !result.pass)) {
    console.error(JSON.stringify({ status: "FAIL", results }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ status: "PASS", results }, null, 2));
  }
} finally {
  await moduleLoader.close();
}
