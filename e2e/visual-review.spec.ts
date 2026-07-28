import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { emptyProgress, installProgress, seededProgress, type ProgressFixture } from "./support";

interface VisualState {
  name: string;
  route: string;
  progress?: ProgressFixture;
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  prepare?: (page: Page) => Promise<void>;
  afterNavigate?: (page: Page) => Promise<void>;
}

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
    window.scrollTo(0, 0);
  });
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
    name: "reduced-motion",
    route: "/tools",
    progress: {
      ...structuredClone(seededProgress),
      accessibility: { reducedMotion: true, highContrast: false }
    },
    viewport: { width: 1024, height: 900 }
  }
];

for (const state of reviewStates) {
  test(`@visual-review capture: ${state.name}`, async ({ page }, testInfo) => {
    await captureState(page, testInfo, state);
  });
}
