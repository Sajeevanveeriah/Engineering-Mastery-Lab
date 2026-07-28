import { expect, test, type Page, type TestInfo } from "@playwright/test";
import {
  createV4Progress,
  emptyProgress,
  installProgress,
  seededProgress,
  type CurriculumRecordFixture,
  type ProgressFixture,
  type ProgressFixtureV4
} from "./support";

interface VisualState {
  name: string;
  route: string;
  progress?: ProgressFixture | ProgressFixtureV4;
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  preserveScroll?: boolean;
  prepare?: (page: Page) => Promise<void>;
  afterNavigate?: (page: Page) => Promise<void>;
}

function curriculumRecord(
  overrides: Partial<CurriculumRecordFixture> = {}
): CurriculumRecordFixture {
  return {
    status: "in-progress",
    blocker: null,
    confidence: 3,
    actualMinutes: 25,
    notes: "Representative visual-review record.",
    evidenceReferences: ["test:visual-review"],
    attemptCount: 1,
    diagnosticScore: null,
    gateResult: "not-assessed",
    completedAt: null,
    contentVersion: "2026.07.28",
    ...overrides
  };
}

const todayInProgress = createV4Progress(seededProgress, {
  curriculumRecords: {
    S001: curriculumRecord({ status: "done", gateResult: "not-assessed", completedAt: "2026-07-27T02:00:00Z" }),
    S002: curriculumRecord({ status: "in-progress", actualMinutes: 12, evidenceReferences: [] })
  }
});

const completedM0 = createV4Progress(seededProgress, {
  curriculumRecords: Object.fromEntries(
    Array.from({ length: 6 }, (_, index) => {
      const id = `S${String(index + 1).padStart(3, "0")}`;
      return [id, curriculumRecord({
        status: "done",
        gateResult: id === "S006" ? "passed" : "not-assessed",
        completedAt: "2026-07-27T02:00:00Z"
      })];
    })
  )
});

const diagnosticPass = createV4Progress(emptyProgress, {
  curriculumRecords: {
    "DIAG-M0": curriculumRecord({
      status: "done",
      diagnosticScore: 4,
      gateResult: "passed",
      completedAt: "2026-07-27T02:00:00Z"
    })
  }
});

const diagnosticStudyRequired = createV4Progress(emptyProgress, {
  curriculumRecords: {
    "DIAG-M0": curriculumRecord({
      status: "done",
      diagnosticScore: 2,
      gateResult: "study-required",
      completedAt: "2026-07-27T02:00:00Z"
    })
  }
});

async function captureState(page: Page, testInfo: TestInfo, state: VisualState): Promise<void> {
  await page.setViewportSize(state.viewport ?? { width: 1440, height: 1000 });
  await installProgress(page, state.progress ?? emptyProgress);
  await state.prepare?.(page);
  await page.goto(`#${state.route}`);
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  await state.afterNavigate?.(page);
  await expect(page.locator("main#main-content h1").first()).toBeVisible();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  if (!state.preserveScroll) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath(`${state.name}.png`),
    animations: "disabled",
    fullPage: state.fullPage ?? true
  });
}

const reviewStates: VisualState[] = [
  {
    name: "new-user-onboarding",
    route: "/",
    progress: { ...structuredClone(emptyProgress), onboardingComplete: false }
  },
  { name: "today-empty", route: "/" },
  { name: "today-seeded", route: "/", progress: seededProgress },
  { name: "today-curriculum-in-progress", route: "/", progress: todayInProgress },
  { name: "today-milestone-complete", route: "/", progress: completedM0 },
  { name: "complete-curriculum-roadmap", route: "/learn/roadmap", viewport: { width: 1440, height: 1100 } },
  {
    name: "reboot-roadmap-m0",
    route: "/learn/reboot",
    viewport: { width: 1440, height: 1100 },
    fullPage: false,
    preserveScroll: true,
    afterNavigate: async (page) => page.locator("#milestone-M0").scrollIntoViewIfNeeded()
  },
  {
    name: "reboot-roadmap-m5",
    route: "/learn/reboot",
    viewport: { width: 1440, height: 1100 },
    fullPage: false,
    preserveScroll: true,
    afterNavigate: async (page) => page.locator("#milestone-M5").scrollIntoViewIfNeeded()
  },
  {
    name: "reboot-roadmap-m9",
    route: "/learn/reboot",
    viewport: { width: 1440, height: 1100 },
    fullPage: false,
    preserveScroll: true,
    afterNavigate: async (page) => page.locator("#milestone-M9").scrollIntoViewIfNeeded()
  },
  { name: "reboot-session-s001", route: "/learn/reboot/sessions/S001", viewport: { width: 1440, height: 1100 } },
  { name: "reboot-session-s110", route: "/learn/reboot/sessions/S110", viewport: { width: 1440, height: 1100 } },
  { name: "diagnostic-pass", route: "/learn/diagnostics", progress: diagnosticPass },
  { name: "diagnostic-study-required", route: "/learn/diagnostics", progress: diagnosticStudyRequired },
  { name: "worked-maths-module", route: "/learn/modules/EML-E1-D04", viewport: { width: 1440, height: 1100 } },
  { name: "circuit-module", route: "/learn/modules/EML-E2-D11", viewport: { width: 1440, height: 1100 } },
  { name: "robotics-simulation-module", route: "/learn/modules/EML-E3-D18", viewport: { width: 1440, height: 1100 } },
  { name: "ai-ml-evaluation-module", route: "/learn/modules/EML-E3-D22", viewport: { width: 1440, height: 1100 } },
  { name: "rover-release-p1", route: "/projects/releases/P1" },
  { name: "rover-release-p2", route: "/projects/releases/P2" },
  { name: "rover-release-p3", route: "/projects/releases/P3" },
  { name: "rover-release-p4", route: "/projects/releases/P4" },
  { name: "curriculum-progress-analysis", route: "/tools/progress", progress: completedM0 },
  { name: "capstone-evidence", route: "/portfolio/capstone", progress: completedM0 },
  { name: "curriculum-resources", route: "/learn/resources", viewport: { width: 1440, height: 1100 } },
  { name: "learn-discovery", route: "/learn" },
  { name: "pathway-detail", route: "/learn/pathways/controls", progress: seededProgress },
  { name: "laboratory-learn", route: "/learn/labs/pid?stage=learn" },
  { name: "laboratory-simulator", route: "/learn/labs/pid?stage=simulate", progress: seededProgress },
  { name: "build-catalogue", route: "/projects", progress: seededProgress },
  { name: "project-detail", route: "/projects/temperature-controller", progress: seededProgress },
  { name: "analyse", route: "/tools", progress: seededProgress },
  { name: "calculator-suite", route: "/tools/calculators" },
  {
    name: "engineering-motor-sizing",
    route: "/tools/engineering",
    viewport: { width: 1440, height: 1100 }
  },
  {
    name: "engineering-scenario-comparison",
    route: "/tools/engineering",
    viewport: { width: 1440, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByRole("button", { name: "Scenarios" }).click();
      await expect(page.getByRole("heading", { name: "Changed outputs" })).toBeVisible();
    }
  },
  {
    name: "engineering-dataset-valid",
    route: "/tools/engineering",
    viewport: { width: 1440, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByRole("button", { name: "Dataset" }).click();
      await page.getByRole("button", { name: "Validate preview" }).click();
      await expect(page.getByRole("table", { name: "Learner load data: 2 rows" })).toBeVisible();
    }
  },
  {
    name: "engineering-dataset-invalid",
    route: "/tools/engineering",
    viewport: { width: 1440, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByRole("button", { name: "Dataset" }).click();
      await page.getByLabel("CSV content").fill("case,torque,torque\ncontinuous,10,20");
      await page.getByRole("button", { name: "Validate preview" }).click();
      await expect(page.getByRole("alert")).toBeVisible();
    }
  },
  {
    name: "engineering-notebook-sanitised",
    route: "/tools/engineering",
    viewport: { width: 1440, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByRole("button", { name: "Notebook" }).click();
      await page.getByLabel("Plain-text reflection").fill(
        'Before <script>alert("unsafe")</script><b>after</b>'
      );
      await page.getByRole("button", { name: "Add sanitised note" }).click();
      await expect(page.getByText("Before after")).toBeVisible();
    }
  },
  {
    name: "engineering-evidence-lineage",
    route: "/tools/engineering",
    viewport: { width: 1440, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByRole("button", { name: "Evidence lineage" }).click();
      await expect(page.getByRole("table", { name: "Accessible evidence graph alternative" })).toBeVisible();
    }
  },
  {
    name: "engineering-project-pack-report",
    route: "/tools/engineering",
    viewport: { width: 1440, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByRole("button", { name: "Bundle and reports" }).click();
      await page.getByText("Preview complete Markdown report").click();
      await expect(page.locator("pre.report-preview")).toBeVisible();
    }
  },
  {
    name: "flagship-controls",
    route: "/learn/flagships/controls",
    viewport: { width: 1440, height: 1100 }
  },
  {
    name: "prove-kernel-record",
    route: "/learn/flagships/controls",
    progress: emptyProgress,
    viewport: { width: 1440, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByRole("button", { name: "Add kernel record to Prove" }).click();
      await expect(page.getByRole("status")).toBeVisible();
      await page.goto("#/portfolio");
      await expect(page.getByRole("heading", { level: 1, name: "Prove" })).toBeVisible();
    }
  },
  {
    name: "flagship-robotics-autonomy",
    route: "/learn/flagships/robotics-autonomy",
    viewport: { width: 1440, height: 1100 }
  },
  {
    name: "flagship-embedded-sensing",
    route: "/learn/flagships/embedded-electronics-sensing",
    viewport: { width: 1440, height: 1100 }
  },
  {
    name: "flagship-mechanical-dynamics",
    route: "/learn/flagships/mechanical-design-dynamics",
    viewport: { width: 1440, height: 1100 }
  },
  {
    name: "flagship-applied-ai-ml",
    route: "/learn/flagships/applied-ai-ml",
    viewport: { width: 1440, height: 1100 }
  },
  {
    name: "flagship-controls-mobile",
    route: "/learn/flagships/controls",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "flagship-robotics-autonomy-mobile",
    route: "/learn/flagships/robotics-autonomy",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "flagship-embedded-sensing-mobile",
    route: "/learn/flagships/embedded-electronics-sensing",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "flagship-mechanical-dynamics-mobile",
    route: "/learn/flagships/mechanical-design-dynamics",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "flagship-applied-ai-ml-mobile",
    route: "/learn/flagships/applied-ai-ml",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "hosted-capabilities-unavailable",
    route: "/settings",
    viewport: { width: 1440, height: 1100 }
  },
  {
    name: "import-preview",
    route: "/settings",
    viewport: { width: 1024, height: 1100 },
    afterNavigate: async (page) => {
      await page.getByLabel("Choose progress backup").setInputFiles({
        name: "validated-progress-v2.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(emptyProgress))
      });
      await expect(page.getByRole("region", { name: "validated-progress-v2.json" })).toBeVisible();
    }
  },
  {
    name: "import-conflict",
    route: "/settings",
    viewport: { width: 1024, height: 1100 },
    afterNavigate: async (page) => {
      const first = curriculumRecord({ status: "in-progress", notes: "alias" });
      const second = curriculumRecord({ status: "in-progress", notes: "canonical" });
      const conflicting = createV4Progress(emptyProgress, {
        curriculumRecords: {
          "EML-E3-ROS2": first,
          "EML-E3-D18": second
        }
      });
      await page.getByLabel("Choose progress backup").setInputFiles({
        name: "conflicting-progress-v4.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(conflicting))
      });
      await expect(page.getByRole("alert")).toContainText("conflicting records");
    }
  },
  {
    name: "cad-webgl",
    route: "/tools/cad",
    viewport: { width: 1440, height: 1100 },
    fullPage: false,
    afterNavigate: async (page) => {
      const canvas = page.locator("canvas[data-cad-preview]");
      await expect(canvas).toBeVisible();
      await canvas.evaluate(async (element) => {
        const dataUrl = await new Promise<string>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(element.toDataURL("image/png"))));
        });
        const framebuffer = document.createElement("img");
        framebuffer.src = dataUrl;
        framebuffer.alt = "";
        framebuffer.dataset.cadFramebufferSnapshot = "true";
        framebuffer.style.position = "absolute";
        framebuffer.style.inset = "0";
        framebuffer.style.width = "100%";
        framebuffer.style.height = "100%";
        element.style.visibility = "hidden";
        element.parentElement?.prepend(framebuffer);
      });
    }
  },
  {
    name: "cad-fallback",
    route: "/tools/cad",
    prepare: async (page) => {
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function getContext(
          contextId: string,
          options?: CanvasRenderingContext2DSettings
        ) {
          if (contextId.toLocaleLowerCase("en-AU").includes("webgl")) return null;
          return originalGetContext.call(this, contextId as "2d", options);
        } as typeof HTMLCanvasElement.prototype.getContext;
      });
    }
  },
  { name: "prove-empty", route: "/portfolio" },
  { name: "prove-representative", route: "/portfolio", progress: seededProgress },
  {
    name: "mobile-shell-navigation",
    route: "/",
    progress: seededProgress,
    viewport: { width: 390, height: 844 },
    fullPage: false,
    afterNavigate: async (page) => {
      const navigationTrigger = page.getByRole("button", { name: "Open navigation" });
      await navigationTrigger.click();
      await expect(page.locator("#primary-navigation-drawer")).toHaveClass(/product-rail--open/);
      await expect(page.getByRole("button", { name: "Close navigation" }).first()).toBeFocused();
      await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }));
      await expect(navigationTrigger).toHaveAttribute("aria-expanded", "true");
    }
  },
  {
    name: "dark-mode",
    route: "/learn",
    progress: { ...structuredClone(seededProgress), theme: "dark" },
    viewport: { width: 1024, height: 900 }
  },
  {
    name: "system-resolved-light",
    route: "/settings",
    progress: createV4Progress(seededProgress, { themePreference: "system" }),
    prepare: async (page) => page.emulateMedia({ colorScheme: "light" }),
    viewport: { width: 1024, height: 900 }
  },
  {
    name: "system-resolved-dark",
    route: "/settings",
    progress: createV4Progress(seededProgress, { themePreference: "system" }),
    prepare: async (page) => page.emulateMedia({ colorScheme: "dark" }),
    viewport: { width: 1024, height: 900 }
  },
  {
    name: "manual-light",
    route: "/settings",
    progress: createV4Progress(seededProgress, { themePreference: "light" }),
    prepare: async (page) => page.emulateMedia({ colorScheme: "dark" }),
    viewport: { width: 1024, height: 900 }
  },
  {
    name: "manual-dark",
    route: "/settings",
    progress: createV4Progress(seededProgress, { themePreference: "dark" }),
    prepare: async (page) => page.emulateMedia({ colorScheme: "light" }),
    viewport: { width: 1024, height: 900 }
  },
  {
    name: "reduced-motion",
    route: "/tools",
    progress: {
      ...structuredClone(seededProgress),
      accessibility: { reducedMotion: true, highContrast: false }
    },
    viewport: { width: 1024, height: 900 }
  },
  {
    name: "higher-contrast",
    route: "/learn/roadmap",
    progress: {
      ...createV4Progress(seededProgress),
      accessibility: { reducedMotion: false, highContrast: true }
    },
    viewport: { width: 1024, height: 900 }
  },
  {
    name: "forced-colours",
    route: "/learn/roadmap",
    prepare: async (page) => page.emulateMedia({ forcedColors: "active" }),
    viewport: { width: 1024, height: 900 }
  }
];

for (const state of reviewStates) {
  test(`@visual-review capture: ${state.name}`, async ({ page }, testInfo) => {
    await captureState(page, testInfo, state);
  });
}
