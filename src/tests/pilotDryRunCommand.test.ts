import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  formatSyntheticPilotDryRunSummary,
  type SyntheticPilotDryRunResult
} from "../lib/ecosystem";

const childProcessTimeout = 60_000;

function runPilotCommand(extraArguments: string[] = []) {
  return spawnSync(process.execPath, ["scripts/run-pilot-dry-run.mjs", ...extraArguments], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: childProcessTimeout,
    killSignal: "SIGTERM",
    windowsHide: true,
    env: {
      ...process.env,
      NO_UPDATE_NOTIFIER: "1",
      npm_config_update_notifier: "false"
    }
  });
}

function parsePilotOutput(stdout: string): {
  json: string;
  result: SyntheticPilotDryRunResult;
  summary: string;
} {
  const jsonPrefix = "PILOT_DRY_RUN_JSON=";
  const summaryMarker = "PILOT_DRY_RUN_SUMMARY\n";
  const firstLineEnd = stdout.indexOf("\n");
  if (!stdout.startsWith(jsonPrefix) || firstLineEnd < 0) {
    throw new Error("pilot dry-run command output markers missing");
  }
  const json = stdout.slice(jsonPrefix.length, firstLineEnd);
  const result = JSON.parse(json) as SyntheticPilotDryRunResult;
  const summary = formatSyntheticPilotDryRunSummary(result);
  const expected = `${jsonPrefix}${json}\n${summaryMarker}${summary}\n`;
  if (stdout !== expected) {
    throw new Error("pilot dry-run command output envelope is not canonical");
  }
  return {
    json,
    result,
    summary
  };
}

it("prints byte-repeatable JSON and its matching accessible summary", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8")
  ) as { scripts?: Record<string, string> };
  expect(packageJson.scripts?.["pilot:dry-run"])
    .toBe("node scripts/run-pilot-dry-run.mjs");
  const first = runPilotCommand();
  const second = runPilotCommand();
  expect(first.error, first.stderr).toBeUndefined();
  expect(second.error, second.stderr).toBeUndefined();
  expect(first.status, first.stderr).toBe(0);
  expect(second.status, second.stderr).toBe(0);
  expect(first.stderr).toBe("");
  expect(second.stderr).toBe("");
  expect(first.signal).toBeNull();
  expect(second.signal).toBeNull();
  const firstOutput = parsePilotOutput(first.stdout);
  const secondOutput = parsePilotOutput(second.stdout);
  expect(firstOutput.json).toBe(secondOutput.json);
  expect(firstOutput.summary).toBe(formatSyntheticPilotDryRunSummary(firstOutput.result));
  expect(secondOutput.summary).toBe(firstOutput.summary);
  expect(firstOutput.json).not.toMatch(/actor:|@|"(?:name|email|phone|address)"/i);
}, 120_000);

it("rejects unexpected command arguments before producing output", () => {
  const rejected = runPilotCommand(["Example Learner Name"]);
  expect(rejected.error, rejected.stderr).toBeUndefined();
  expect(rejected.signal).toBeNull();
  expect(rejected.status).not.toBe(0);
  expect(rejected.stdout).toBe("");
  expect(rejected.stderr).toBe("pilot dry-run accepts no arguments\n");
}, 120_000);

it("rejects known-defective output envelopes", () => {
  const success = runPilotCommand();
  expect(success.error, success.stderr).toBeUndefined();
  expect(success.status, success.stderr).toBe(0);
  const parsed = parsePilotOutput(success.stdout);
  const jsonLine = `PILOT_DRY_RUN_JSON=${parsed.json}`;
  const summaryBlock = `PILOT_DRY_RUN_SUMMARY\n${parsed.summary}`;
  for (const defective of [
    `unexpected prefix\n${success.stdout}`,
    `${success.stdout}unexpected suffix\n`,
    `${jsonLine}\n${jsonLine}\n${summaryBlock}\n`,
    `${jsonLine}\n${summaryBlock}\n${summaryBlock}\n`,
    success.stdout.replaceAll("\n", "\r\n")
  ]) {
    expect(() => parsePilotOutput(defective)).toThrow();
  }
}, 120_000);

it("returns non-zero when the production invariant validator receives a deliberate failure", () => {
  const failureProgram = `
    import { createServer } from "vite";
    const server = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
    try {
      const pilot = await server.ssrLoadModule("/src/lib/ecosystem/pilotDryRun.ts");
      const result = structuredClone(pilot.runSyntheticPilotDryRun());
      const scenario = result.scenarios.find(({ id }) => id === "standard-five-learner-release");
      scenario.aggregate.completionRate = 0.4;
      pilot.assertSyntheticPilotDryRunResult(result);
    } finally {
      await server.close();
    }
  `;
  const failure = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", failureProgram],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: childProcessTimeout,
      killSignal: "SIGTERM",
      windowsHide: true
    }
  );
  expect(failure.error, failure.stderr).toBeUndefined();
  expect(failure.signal).toBeNull();
  expect(failure.status).not.toBe(0);
  expect(`${failure.stdout}\n${failure.stderr}`)
    .toContain("five-learner aggregate invariant failed");
}, 120_000);

it("bounds and terminates a deliberately hanging command", () => {
  const hanging = spawnSync(
    process.execPath,
    [
      "--eval",
      "process.stdout.write(`${process.pid}\\n`); setInterval(() => undefined, 1_000);"
    ],
    {
      encoding: "utf8",
      timeout: 1_000,
      killSignal: "SIGTERM",
      windowsHide: true
    }
  );
  const childPid = Number.parseInt(hanging.stdout.trim(), 10);
  expect(hanging.error && "code" in hanging.error ? hanging.error.code : undefined)
    .toBe("ETIMEDOUT");
  expect(hanging.status).toBeNull();
  expect(Number.isSafeInteger(childPid)).toBe(true);
  expect(() => process.kill(childPid, 0)).toThrow();
}, 10_000);
