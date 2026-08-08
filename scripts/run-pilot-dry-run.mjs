import dgram from "node:dgram";
import dns, { resolve4 as namedDnsResolve4 } from "node:dns";
import dnsPromises from "node:dns/promises";
import http, { get as namedHttpGet } from "node:http";
import http2 from "node:http2";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import tls from "node:tls";

const replacements = [];

function replaceFunction(target, key, replacement) {
  const original = target[key];
  if (typeof original !== "function") return;
  target[key] = replacement;
  replacements.push(() => {
    target[key] = original;
  });
}

function installNetworkDenyGuards(observation) {
  const deny = (boundary) => {
    return function denyBoundary() {
      observation.networkRequests += 1;
      throw new Error(`pilot dry-run attempted ${boundary}`);
    };
  };

  replaceFunction(globalThis, "fetch", deny("fetch"));
  replaceFunction(globalThis, "WebSocket", deny("WebSocket"));
  replaceFunction(globalThis, "XMLHttpRequest", deny("XMLHttpRequest"));
  replaceFunction(http, "request", deny("http.request"));
  replaceFunction(http, "get", deny("http.get"));
  replaceFunction(https, "request", deny("https.request"));
  replaceFunction(https, "get", deny("https.get"));
  replaceFunction(http2, "connect", deny("http2.connect"));
  replaceFunction(net, "connect", deny("net.connect"));
  replaceFunction(net, "createConnection", deny("net.createConnection"));
  replaceFunction(net.Socket.prototype, "connect", deny("net.Socket.connect"));
  replaceFunction(tls, "connect", deny("tls.connect"));
  replaceFunction(dgram, "createSocket", deny("dgram.createSocket"));
  for (const key of ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr", "resolveSoa", "resolveSrv", "resolveTxt", "reverse"]) {
    replaceFunction(dns, key, deny(`dns.${key}`));
    replaceFunction(dnsPromises, key, deny(`dns.promises.${key}`));
  }
  if (typeof globalThis.navigator === "object") {
    replaceFunction(globalThis.navigator, "sendBeacon", deny("navigator.sendBeacon"));
  }
  syncBuiltinESMExports();
}

function restoreReplacements() {
  while (replacements.length > 0) replacements.pop()();
  syncBuiltinESMExports();
}

function verifyNetworkDenyDetector() {
  const observation = { networkRequests: 0 };
  const originalNamedHttpGet = namedHttpGet;
  const originalNamedDnsResolve4 = namedDnsResolve4;
  installNetworkDenyGuards(observation);
  let deniedCount = 0;
  const exportsSynchronized =
    namedHttpGet === http.get && namedDnsResolve4 === dns.resolve4;
  try {
    if (exportsSynchronized) {
      for (const [boundary, probe] of [
        ["http.get", () => http.get("http://example.invalid")],
        ["http.get", () => namedHttpGet("http://example.invalid")],
        ["dns.resolve4", () => dns.resolve4("example.invalid", () => undefined)],
        ["dns.resolve4", () => namedDnsResolve4("example.invalid", () => undefined)]
      ]) {
        try {
          probe();
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === `pilot dry-run attempted ${boundary}`
          ) {
            deniedCount += 1;
          }
        }
      }
    }
  } finally {
    restoreReplacements();
  }
  const exportsRestored =
    namedHttpGet === originalNamedHttpGet &&
    namedDnsResolve4 === originalNamedDnsResolve4;
  if (
    !exportsSynchronized ||
    !exportsRestored ||
    deniedCount !== 4 ||
    observation.networkRequests !== 4
  ) {
    throw new Error("pilot dry-run network deny detector self-test failed");
  }
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("pilot dry-run accepts no arguments");
  }

  const observation = {
    networkRequests: 0,
    telemetryEvents: 0,
    accountsCreated: 0,
    billingConnections: 0,
    hostedProvidersConnected: 0
  };
  verifyNetworkDenyDetector();
  installNetworkDenyGuards(observation);
  let moduleServer;

  try {
    const { createServer } = await import("vite");
    moduleServer = await createServer({
      appType: "custom",
      logLevel: "silent",
      server: { middlewareMode: true }
    });
    const pilot = await moduleServer.ssrLoadModule(
      "/src/lib/ecosystem/pilotDryRun.ts"
    );
    const providers = await moduleServer.ssrLoadModule("/src/lib/providers.ts");
    const originalRecord = providers.noOpProductEventProvider.record;
    providers.noOpProductEventProvider.record = () => {
      observation.telemetryEvents += 1;
      throw new Error("pilot dry-run attempted a telemetry event");
    };
    replacements.push(() => {
      providers.noOpProductEventProvider.record = originalRecord;
    });
    let telemetryDetectorDenied = false;
    try {
      providers.noOpProductEventProvider.record("detector-self-test");
    } catch (error) {
      telemetryDetectorDenied = error instanceof Error &&
        error.message === "pilot dry-run attempted a telemetry event";
    }
    if (!telemetryDetectorDenied || observation.telemetryEvents !== 1) {
      throw new Error("pilot dry-run telemetry deny detector self-test failed");
    }
    observation.telemetryEvents = 0;
    const result = pilot.runSyntheticPilotDryRun();

    if (providers.localLearnerProvider.mode !== "local-profile") {
      observation.accountsCreated += 1;
    }
    if (providers.localBillingProvider.available) {
      observation.billingConnections += 1;
    }
    if (result.hostedCapabilities.some((capability) => capability.hostedService)) {
      observation.hostedProvidersConnected += 1;
    }
    const telemetryProvider = providers.noOpProductEventProvider;
    if (
      telemetryProvider.mode !== "no-op" ||
      telemetryProvider.telemetryCollected !== false ||
      telemetryProvider.capability.id !== "telemetry" ||
      telemetryProvider.capability.status !== "unavailable" ||
      telemetryProvider.capability.executionBoundary !== "none" ||
      telemetryProvider.capability.networkAccess ||
      telemetryProvider.capability.hostedService ||
      telemetryProvider.capability.dataUse !== "none"
    ) {
      throw new Error("telemetry provider availability invariant failed");
    }
    if (JSON.stringify(result.executionBoundary) !== JSON.stringify(observation)) {
      throw new Error("instrumented execution boundary invariant failed");
    }

    const machineReadable = JSON.stringify(result);
    const humanReadable = pilot.formatSyntheticPilotDryRunSummary(result);
    console.log(`PILOT_DRY_RUN_JSON=${machineReadable}`);
    console.log(`PILOT_DRY_RUN_SUMMARY\n${humanReadable}`);
  } finally {
    restoreReplacements();
    await moduleServer?.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
