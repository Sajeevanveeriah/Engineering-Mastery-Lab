import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Base path matches the GitHub Pages project URL:
// https://<user>.github.io/Engineering-Mastery-Lab/
// The Tauri CLI sets TAURI_ENV_PLATFORM while building the desktop app, which
// needs relative asset paths instead.
export default defineConfig({
  plugins: [react()],
  base: process.env.TAURI_ENV_PLATFORM ? "./" : "/Engineering-Mastery-Lab/",
  test: {
    environment: "node",
    globals: true,
    include: ["src/tests/**/*.test.ts"]
  }
});
