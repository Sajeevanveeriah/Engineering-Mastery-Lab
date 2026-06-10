import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Base path matches the GitHub Pages project URL:
// https://<user>.github.io/engineering-mastery-lab/
export default defineConfig({
  plugins: [react()],
  base: "/engineering-mastery-lab/",
  test: {
    environment: "node",
    globals: true,
    include: ["src/tests/**/*.test.ts"]
  }
});
