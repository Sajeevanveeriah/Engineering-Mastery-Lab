import { createConnection } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const host = "127.0.0.1";
const port = 4174;
const shutdownUrl =
  "http://127.0.0.1:4174/__engineering-mastery-lab-playwright-shutdown__";
const shutdownTokenEnvironmentVariable =
  "ENGINEERING_MASTERY_LAB_PLAYWRIGHT_SHUTDOWN_TOKEN";

function isPreviewPortOpen() {
  return new Promise<boolean>((resolve) => {
    const socket = createConnection({ host, port });
    let settled = false;

    const finish = (isOpen: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(isOpen);
    };

    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(500, () => finish(false));
  });
}

export default async function globalTeardown() {
  const shutdownToken = process.env[shutdownTokenEnvironmentVariable]?.trim();
  if (!shutdownToken) {
    throw new Error("Playwright preview shutdown token is unavailable.");
  }

  let response: Response;
  try {
    response = await fetch(shutdownUrl, {
      method: "POST",
      headers: {
        "x-engineering-mastery-lab-playwright": shutdownToken
      },
      signal: AbortSignal.timeout(10_000)
    });
  } catch (error) {
    if (!(await isPreviewPortOpen())) return;
    throw error;
  }

  if (
    response.status !== 204 ||
    response.headers.get("x-engineering-mastery-lab-playwright-shutdown") !==
      "accepted"
  ) {
    throw new Error(
      `Playwright preview shutdown returned an invalid acknowledgement (HTTP ${response.status}).`
    );
  }

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!(await isPreviewPortOpen())) return;
    await delay(100);
  }

  throw new Error("Playwright preview port remained open after shutdown.");
}
