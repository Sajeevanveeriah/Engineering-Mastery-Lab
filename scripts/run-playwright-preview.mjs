import { preview } from "vite";

const host = "127.0.0.1";
const port = 4174;
const shutdownPath = "/__engineering-mastery-lab-playwright-shutdown__";
const shutdownHeader = "x-engineering-mastery-lab-playwright";
const shutdownToken =
  process.env.ENGINEERING_MASTERY_LAB_PLAYWRIGHT_SHUTDOWN_TOKEN?.trim();
const loopbackAddresses = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

if (!shutdownToken) {
  throw new Error("Playwright preview shutdown token is required.");
}

function playwrightLifecyclePlugin() {
  return {
    name: "engineering-mastery-lab-playwright-lifecycle",
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url !== shutdownPath) {
          next();
          return;
        }

        if (request.method !== "POST") {
          response.statusCode = 405;
          response.setHeader("Allow", "POST");
          response.end();
          return;
        }

        const remoteAddress = request.socket.remoteAddress ?? "";
        if (
          !loopbackAddresses.has(remoteAddress) ||
          request.headers[shutdownHeader] !== shutdownToken
        ) {
          response.statusCode = 403;
          response.end();
          return;
        }

        response.once("finish", () => {
          setImmediate(async () => {
            try {
              await server.close();
              process.exit(0);
            } catch (error) {
              console.error("Playwright preview shutdown failed.", error);
              process.exit(1);
            }
          });
        });

        response.statusCode = 204;
        response.setHeader("x-engineering-mastery-lab-playwright-shutdown", "accepted");
        response.end();
      });
    }
  };
}

await preview({
  configFile: "vite.config.ts",
  plugins: [playwrightLifecyclePlugin()],
  preview: {
    host,
    port,
    strictPort: true
  }
});
