import { expect, test } from "@playwright/test";
import {
  academyMediaPlacementByLessonId,
  getAcademyMedia
} from "../src/data/academyMedia";
import {
  emptyProgress,
  installProgress,
  monitorRuntimeErrors
} from "./support";

const firstCourseRoute = "/learn/courses/ACADEMY-E0";
const firstUnitRoute = `${firstCourseRoute}/units/EML-E0-D01`;
const firstLessonRoute = `${firstUnitRoute}/lessons/EML-E0-D01-L01`;
const mediaLessonRoute =
  "/learn/courses/ACADEMY-E1/units/EML-E1-D04/lessons/EML-E1-D04-L01";
const mediaLessonId = "EML-E1-D04-L01";
const mediaPlacement = academyMediaPlacementByLessonId.get(mediaLessonId);
if (!mediaPlacement) throw new Error(`Missing media placement for ${mediaLessonId}.`);
const mediaSpec = getAcademyMedia(mediaPlacement.mediaId);
if (!mediaSpec?.providerId) throw new Error(`Missing media for ${mediaLessonId}.`);
const laterStageRoute =
  "/learn/courses/ACADEMY-E4/units/EML-E4-D24/lessons/EML-E4-D24-L01";

test.beforeEach(async ({ page }) => {
  await installProgress(page, emptyProgress);
});

test("native lesson teaching and practice do not depend on a third-party request", async ({ page }) => {
  const externalRequests: string[] = [];
  await page.route(/^https:\/\//, (route) => {
    externalRequests.push(route.request().url());
    return route.abort();
  });

  await page.goto(`#${firstLessonRoute}`);

  await expect(page.locator(".academy-lesson-content h1")).toBeVisible();
  await expect(page.locator(".academy-v2")).toBeVisible();
  await expect(page.locator(".academy-v2__embedded-note")).toContainText(
    "Complete native lesson"
  );
  await expect(page.locator(".academy-v2-question-pair")).toHaveCount(4);
  await expect(page.locator(".academy-laboratory-callout")).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test("the complete written academy remains available after the web app is cached", async ({ page, context }) => {
  await page.goto(`#${firstLessonRoute}`);
  await expect(page.locator(".academy-lesson-content h1")).toBeVisible();
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active?.state !== "activated") {
      await new Promise<void>((resolve) => {
        registration.addEventListener("updatefound", () => resolve(), { once: true });
        setTimeout(resolve, 5_000);
      });
    }
  });
  await expect.poll(() =>
    page.evaluate(() => navigator.serviceWorker.controller !== null)
  ).toBe(true);
  const cachedLaterStage = await page.evaluate(async () => {
    const manifestResponse = await fetch("academy-offline-assets.json");
    const manifest = await manifestResponse.json() as { assets: string[] };
    const stageAsset = manifest.assets.find((asset) => /^assets\/E4-.*\.js$/.test(asset));
    if (!stageAsset) return false;
    return (await caches.match(new URL(stageAsset, document.baseURI))) !== undefined;
  });
  expect(cachedLaterStage).toBe(true);

  await context.setOffline(true);
  try {
    await page.goto(`#${laterStageRoute}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".academy-lesson-content h1")).toBeVisible();
    await expect(page.locator(".academy-v2-question-pair")).toHaveCount(4);
    await expect(page.locator(".academy-sources")).toContainText(
      "optional because the native lesson is complete"
    );
  } finally {
    await context.setOffline(false);
  }
});

test("the final Academy stage uses the same valid lesson and progress identity contract", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);

  await page.goto(`#${laterStageRoute}`);
  await expect(page.locator(".academy-lesson-content h1")).toBeVisible();
  await expect(page.locator(".academy-breadcrumbs")).toContainText("E4");
  expect(runtimeErrors).toEqual([]);
});

test("the mobile lesson outline is a focus-trapped drawer with focus restoration", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`#${firstLessonRoute}`);

  const trigger = page.getByRole("button", {
    name: "Open lesson outline and completion gates"
  });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const drawer = page.getByRole("dialog", { name: "Outline and completion gates" });
  const closeButton = drawer.getByRole("button", { name: "Close outline" });
  await expect(drawer).toBeVisible();
  await expect(closeButton).toBeFocused();
  const outlineItemCount = await page
    .locator(".academy-lesson-outline a")
    .count();
  await expect(drawer.getByRole("link")).toHaveCount(outlineItemCount);

  await page.keyboard.press("Shift+Tab");
  await expect(drawer.getByRole("link").last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("diagnostics use reviewed automatically scored questions and never self-award proof", async ({ page }) => {
  await page.goto("#/learn/diagnostics");

  await expect(page.getByRole("heading", { level: 1, name: "Curriculum diagnostics" }))
    .toBeVisible();
  await expect(page.locator("select")).toHaveCount(0);
  await page.getByRole("button", { name: "Start assessed diagnostic" }).first().click();
  const workspace = page.getByRole("region", { name: "M0 knowledge diagnostic" });
  await expect(workspace.locator(".academy-question")).toHaveCount(4);
  await expect(workspace).toContainText("this diagnostic never awards laboratory or project proof");
  await expect(workspace.getByRole("button", { name: "Record diagnostic result" }))
    .toBeDisabled();
});

test("the academy catalogue, course, unit, quiz and lesson reflow across the required web matrix", async ({ page }) => {
  const viewports = [
    { label: "320 px and 400 percent equivalent", width: 320, height: 210 },
    { label: "390 px", width: 390, height: 844 },
    { label: "minimum desktop window", width: 480, height: 360 },
    { label: "200 percent equivalent", width: 640, height: 420 },
    { label: "768 px", width: 768, height: 720 },
    { label: "1024 px", width: 1_024, height: 768 },
    { label: "normal desktop window", width: 1_280, height: 840 },
    { label: "1440 px", width: 1_440, height: 900 }
  ] as const;
  const routes = [
    { label: "catalogue", route: "/learn/courses" },
    { label: "E0 course", route: firstCourseRoute },
    { label: "E0 unit", route: firstUnitRoute },
    { label: "E0 unit quiz", route: `${firstUnitRoute}/assessments/quiz` },
    { label: "E0 lesson", route: firstLessonRoute }
  ] as const;

  for (const viewport of viewports) {
    for (const route of routes) {
      await test.step(`${viewport.label} - ${route.label}`, async () => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height
        });
        await page.goto(`#${route.route}`);
        await expect(page.locator("main h1").first()).toBeVisible();
        const overflow = await page.evaluate(() => ({
          document:
            document.documentElement.scrollWidth
            - document.documentElement.clientWidth,
          body: document.body.scrollWidth - document.body.clientWidth
        }));
        expect(
          overflow.document,
          `${route.label} document overflow at ${viewport.label}`
        ).toBeLessThanOrEqual(1);
        expect(
          overflow.body,
          `${route.label} body overflow at ${viewport.label}`
        ).toBeLessThanOrEqual(1);

        if (route.route === firstLessonRoute) {
          if (viewport.width <= 900) {
            await expect(page.getByRole("button", {
              name: "Open lesson outline and completion gates"
            })).toBeVisible();
          } else {
            await expect(
              page.getByRole("complementary", { name: "Lesson outline" })
            ).toBeVisible();
          }
        }
      });
    }
  }
});

test("the academy teaches through complete native course, unit and lesson routes", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);

  await page.goto("#/learn/courses");
  await expect(
    page.getByRole("heading", { level: 1, name: "Learn", exact: true })
  ).toBeVisible();
  await expect(page.getByText("5 courses", { exact: true })).toBeVisible();
  await expect(page.getByText("25 units", { exact: true })).toBeVisible();
  await expect(page.getByText("175 lessons", { exact: true })).toBeVisible();
  await expect(
    page.locator(".academy-path-course").filter({ hasText: "Learning and quantitative foundations" })
  ).toContainText("Current");
  await page.getByRole("link", { name: "Browse the full curriculum" }).click();
  await expect(
    page.locator(".academy-path-course").filter({
      has: page.getByRole("heading", {
        name: "Core engineering and computing foundations",
        exact: true
      })
    })
  ).toContainText("Locked");

  await page.goto(`#${firstCourseRoute}`);
  await expect(page.locator(".academy-unit-row")).toHaveCount(3);
  await expect(page.locator(".academy-unit-row").nth(0)).toContainText("Available");
  await expect(page.locator(".academy-unit-row").nth(1)).toContainText("Locked for sequence");

  await page.goto(`#${firstUnitRoute}`);
  await expect(page.locator(".academy-lesson-sequence > ol > li")).toHaveCount(7);
  await expect(page.getByRole("link", { name: "Open quiz" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open unit test" })).toBeVisible();

  await page.goto(`#${firstLessonRoute}`);
  await expect(page.locator(".academy-lesson-content h1")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "By the end, you can" })
  ).toBeVisible();
  await expect(page.locator(".academy-v2-question-pair")).toHaveCount(4);
  await expect(page.locator(".academy-laboratory-callout")).toBeVisible();
  await expect(page.locator(".academy-retrieval-prompts")).toBeVisible();
  await expect(page.getByText("Sources and attribution", { exact: true })).toBeVisible();
  await expect(page.locator(".academy-v2-section")).toHaveCount(6);
  await expect(page.locator("[data-academy-resume-block]")).toHaveCount(8);
  expect(await page.locator(".academy-lesson-block-anchor").count()).toBeGreaterThanOrEqual(3);
  expect(runtimeErrors).toEqual([]);
});

test("guided practice reveals progressive hints and a solution after an attempt or explicit reveal", async ({ page }) => {
  await page.goto(`#${firstLessonRoute}`);
  const question = page.locator(".academy-v2-question-pair").first()
    .locator(".academy-v2-question").first();

  await expect(question.getByText("Worked solution", { exact: true })).toHaveCount(0);
  await question.getByRole("button", { name: /Show hint 1 of/u }).click();
  await expect(question.getByRole("heading", { name: "Progressive hints" }))
    .toBeVisible();
  await question.getByRole("button", { name: "Show worked solution" }).click();
  await expect(question.getByRole("region", { name: "Worked solution" })).toBeVisible();
  await question.getByRole("button", { name: "Hide worked solution" }).click();
  await question.getByRole("button", { name: "Check order" }).click();
  await expect(question.getByRole("status")).toBeVisible();
  await question.getByRole("button", { name: "Show worked solution" }).click();
  await expect(question.getByRole("region", { name: "Worked solution" })).toBeVisible();
});

test("question retry cases and their bounded attempt history survive reload", async ({ page }) => {
  await page.goto(`#${firstLessonRoute}`);
  const pair = page.locator(".academy-v2-question-pair").first();
  const base = pair.locator(":scope > details").first()
    .locator(".academy-v2-question");

  await base.getByRole("button", { name: /Show hint 1 of/u }).click();
  await base.getByRole("button", { name: "Check order" }).click();
  await expect(base.getByText("Question attempt history (1)")).toBeVisible();

  const retryDetails = pair.locator(":scope > details").nth(1);
  await retryDetails.locator("summary").click();
  const retry = retryDetails.locator(".academy-v2-question");
  await retry.getByRole("button", { name: "Check order" }).click();
  await expect(retry.getByText("Question attempt history (1)")).toBeVisible();

  await expect.poll(() => page.evaluate(
    () => {
    const stored = localStorage.getItem("engineering-mastery-lab/progress/v5");
    if (!stored) return null;
    const progress = JSON.parse(stored) as {
      academy?: {
        questionAttempts?: Record<string, Array<{
          retryIndex?: number;
          hintsUsed?: string[];
          variantSeed?: number;
        }>>;
      };
    };
    const baseAttempts = progress.academy?.questionAttempts?.[
      "EML-E0-D01-L01-V2-Q2-BASE"
    ];
    const retryAttempts = progress.academy?.questionAttempts?.[
      "EML-E0-D01-L01-V2-Q2-RETRY"
    ];
    const simplify = (attempts: typeof baseAttempts) => attempts?.map((attempt) => ({
      retryIndex: attempt.retryIndex,
      hintsUsed: attempt.hintsUsed?.length,
      variantSeed: attempt.variantSeed
    }));
    return {
      base: simplify(baseAttempts),
      retry: simplify(retryAttempts)
    };
  })).toEqual({
    base: [{
      retryIndex: 0,
      hintsUsed: 1,
      variantSeed: 3_569_258_282
    }],
    retry: [{
      retryIndex: 1,
      hintsUsed: 0,
      variantSeed: 2_513_659_303
    }]
  });

  await page.reload();
  const restoredPair = page.locator(".academy-v2-question-pair").first();
  const restoredBase = restoredPair.locator(":scope > details").first()
    .locator(".academy-v2-question");
  await expect(restoredBase.getByRole("heading", { name: "Progressive hints" }))
    .toBeVisible();
  const restoredBaseHistory = restoredBase.locator(
    ".academy-v2-guidance__history"
  );
  await expect(restoredBaseHistory.getByText("Question attempt history (1)"))
    .toBeVisible();
  await restoredBaseHistory.getByText("Question attempt history (1)").click();
  await expect(restoredBaseHistory.locator("tbody tr")).toHaveCount(1);
  await expect(restoredBaseHistory).toContainText("Base");

  const restoredRetryDetails = restoredPair.locator(":scope > details").nth(1);
  await expect(restoredRetryDetails).toHaveAttribute("open", "");
  const restoredRetryHistory = restoredRetryDetails.locator(
    ".academy-v2-guidance__history"
  );
  await expect(restoredRetryHistory.getByText("Question attempt history (1)"))
    .toBeVisible();
});

test("best-score hydration preserves a higher base score after a later lower attempt", async ({ page }) => {
  await page.goto(`#${firstLessonRoute}`);
  await page.evaluate(() => {
    const storageKey = "engineering-mastery-lab/progress/v5";
    const stored = localStorage.getItem(storageKey);
    if (!stored) throw new Error("Expected native version 5 progress.");
    const progress = JSON.parse(stored) as {
      academy: {
        questionAttempts: Record<string, unknown[]>;
        questionInteractions: Record<string, unknown>;
      };
    };
    const questionId = "EML-E0-D01-L01-V2-Q2-BASE";
    const contextId = "EML-E0-D01-L01-V2-ASSESSMENT";
    progress.academy.questionAttempts[questionId] = [
      {
        attemptId: "ATTEMPT-V2-BEST-HIGH",
        contextId,
        questionId,
        questionType: "ordering",
        attemptedAt: "2026-07-30T12:00:00.000Z",
        responseSummary: "Correct ordering",
        isCorrect: true,
        scorePercent: 100,
        misconceptionKeys: [],
        variantSeed: 3_569_258_282,
        retryIndex: 0,
        hintsUsed: []
      },
      {
        attemptId: "ATTEMPT-V2-BEST-LOW",
        contextId,
        questionId,
        questionType: "ordering",
        attemptedAt: "2026-07-30T12:01:00.000Z",
        responseSummary: "Incorrect ordering",
        isCorrect: false,
        scorePercent: 0,
        misconceptionKeys: [],
        variantSeed: 3_569_258_282,
        retryIndex: 0,
        hintsUsed: []
      }
    ];
    progress.academy.questionInteractions[questionId] = {
      questionId,
      contextId,
      scenarioMode: "base",
      retryIndex: 0,
      revealedHintIds: [],
      revealedHintCount: 0,
      solutionRevealed: false,
      retryOpened: false,
      lastAttemptScorePercent: 0,
      lastAttemptIsCorrect: false,
      updatedAt: "2026-07-30T12:01:00.000Z"
    };
    localStorage.setItem(storageKey, JSON.stringify(progress));
  });

  await page.reload();
  await expect(page.getByText("1/4 assessed", { exact: true })).toBeVisible();
  await expect(page.getByText("25% current score", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "V2 lesson assessment score: 25%" })
  ).toHaveAttribute("value", "25");
  await expect(
    page.locator(".academy-v2-question-pair").first()
      .getByText("Question attempt history (2)")
  ).toBeVisible();
});

test("lesson notes, bookmarks and the exact resume cursor survive reload", async ({ page }) => {
  await page.goto(`#${firstLessonRoute}`);
  await expect(page.locator(".academy-lesson-content h1")).toBeVisible();

  await page.locator(".academy-lesson-notes textarea").fill(
    "Check assumptions, units and the retained evidence boundary."
  );
  await page.getByRole("button", { name: "Save local notes" }).click();
  await page.getByRole("button", { name: "Bookmark lesson" }).click();

  const target = page.locator(
    "#EML-E0-D01-L01-V2-FAILURE-BOUNDARY"
  );
  const targetId = await target.getAttribute("id");
  expect(targetId).toBeTruthy();
  await target.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, top - window.innerHeight * 0.28));
  });

  await expect.poll(() => page.evaluate(() => {
    const stored = localStorage.getItem("engineering-mastery-lab/progress/v5");
    if (!stored) return null;
    const progress = JSON.parse(stored) as {
      academy?: {
        resumeCursor?: { blockId?: string };
        lessonRecords?: Record<string, {
          notes?: string;
          bookmarked?: boolean;
          scrollPosition?: number;
        }>;
      };
    };
    const record = progress.academy?.lessonRecords?.["EML-E0-D01-L01"];
    return {
      blockId: progress.academy?.resumeCursor?.blockId,
      notes: record?.notes,
      bookmarked: record?.bookmarked,
      scrollPosition: record?.scrollPosition
    };
  })).toMatchObject({
    blockId: targetId,
    notes: "Check assumptions, units and the retained evidence boundary.",
    bookmarked: true
  });

  await page.reload();
  await expect(page.locator(`#${targetId}`)).toBeVisible();
  await expect(page.locator(".academy-lesson-notes textarea")).toHaveValue(
    "Check assumptions, units and the retained evidence boundary."
  );
  await expect(page.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
  await expect.poll(async () => page.locator(`#${targetId}`).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  })).toBe(true);
});

test("reviewed lesson video is private by default, resumes safely and retains a failure fallback", async ({ page }) => {
  const providerRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://www.youtube-nocookie.com/")) {
      providerRequests.push(request.url());
    }
  });
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Optional video test frame</title>"
    })
  );

  await page.goto(`#${mediaLessonRoute}`);
  const media = page.locator(".academy-media");
  await expect(media).toBeVisible();
  await expect(media.locator("iframe")).toHaveCount(0);
  await expect(media).toContainText("Native lesson fallback");
  expect(providerRequests).toEqual([]);

  await media.getByRole("button", { name: "Allow embedded videos" }).click();
  const frame = media.locator("iframe");
  await expect(frame).toHaveAttribute(
    "src",
    new RegExp(
      `^https://www\\.youtube-nocookie\\.com/embed/${mediaSpec.providerId}\\?`
    )
  );
  await expect.poll(() => providerRequests.length).toBeGreaterThan(0);

  await frame.evaluate((element) => {
    const iframe = element as HTMLIFrameElement;
    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://www.youtube-nocookie.com",
      source: iframe.contentWindow,
      data: JSON.stringify({
        event: "infoDelivery",
        info: { currentTime: 37.9, duration: 1_926 }
      })
    }));
  });
  await expect.poll(() => page.evaluate(({ lessonId, mediaId }) => {
    const stored = localStorage.getItem("engineering-mastery-lab/progress/v5");
    if (!stored) return null;
    const progress = JSON.parse(stored) as {
      academy?: {
        lessonRecords?: Record<string, {
          videoPositions?: Record<string, { positionSeconds?: number }>;
        }>;
      };
    };
      return progress.academy?.lessonRecords?.[lessonId]
        ?.videoPositions?.[mediaId]?.positionSeconds;
    },
    { lessonId: mediaLessonId, mediaId: mediaPlacement.mediaId }
  )).toBe(37);

  await page.reload();
  const reloadedMedia = page.locator(".academy-media");
  await expect(reloadedMedia.locator("iframe")).toHaveAttribute("src", /[?&]start=37(?:&|$)/);
  await reloadedMedia.locator("iframe").dispatchEvent("error");
  await expect(reloadedMedia.locator("iframe")).toHaveCount(0);
  await expect(reloadedMedia.getByRole("alert")).toContainText(
    "complete native lesson and reviewed summary fallback"
  );
  await expect(reloadedMedia.getByRole("alert")).toContainText(
    "The complete native Academy lesson remains the authoritative learning path."
  );
  await expect(reloadedMedia.getByRole("alert")).toContainText(
    "Video is never required for completion or offline study."
  );
  const retryVideo = reloadedMedia.getByRole("button", {
    name: "Retry embedded video"
  });
  await expect(retryVideo).toBeVisible();
  await retryVideo.click();
  await expect(reloadedMedia.getByRole("alert")).toHaveCount(0);
  await expect(
    reloadedMedia.locator("iframe")
  ).toHaveAttribute("src", /[?&]start=37(?:&|$)/);
});

test("optional video withholds undersized player viewports without document overflow", async ({ page }) => {
  const providerRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://www.youtube-nocookie.com/")) {
      providerRequests.push(request.url());
    }
  });
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Optional video viewport test frame</title>"
    })
  );

  await page.goto(`#${mediaLessonRoute}`);
  const media = page.locator(".academy-media");
  await media.evaluate((element) => {
    element.style.width = "320px";
    element.style.maxWidth = "none";
  });
  await media.getByRole("button", { name: "Allow embedded videos" }).click();
  const frame = media.locator("iframe");
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute(
    "sandbox",
    "allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
  );
  const frameBounds = await frame.boundingBox();
  expect(frameBounds?.width).toBeGreaterThanOrEqual(200);
  expect(frameBounds?.height).toBeGreaterThanOrEqual(200);
  const requestsAfterEligibleLoad = providerRequests.length;
  for (const width of [210, 199]) {
    await media.evaluate((element, nextWidth) => {
      element.style.width = `${nextWidth}px`;
    }, width);
    await expect(media.locator("iframe")).toHaveCount(0);
    await expect(media).toContainText("minimum 200 by 200 pixel player viewport");
    expect(providerRequests).toHaveLength(requestsAfterEligibleLoad);
    expect(
      await page.evaluate(() =>
        document.documentElement.scrollWidth
          <= document.documentElement.clientWidth
      )
    ).toBe(true);
  }
});

test("laboratory handoff requires a structured evidence receipt before applied completion", async ({ page }) => {
  const labBlockId = "EML-E0-D01-L01-BLOCK-LAB";
  await page.goto(`#${firstLessonRoute}`);
  const callout = page.locator(".academy-laboratory-callout");
  await expect(callout).toBeVisible();
  await expect(
    callout.getByRole("button", { name: "Record applied task completed" })
  ).toHaveCount(0);
  await expect(callout).toContainText(
    "Learner-attested evidence still required"
  );
  await expect(callout).toContainText("awards nothing");
  await expect(callout).toContainText("does not independently verify");

  const openLaboratory = callout.getByRole("link", { name: "Open the laboratory" });
  await expect(openLaboratory).toHaveAttribute("href", /academyReturn=/);
  await expect(openLaboratory).toHaveAttribute("href", /lesson=EML-E0-D01-L01/);
  await expect(openLaboratory).toHaveAttribute("href", /block=EML-E0-D01-L01-BLOCK-LAB/);
  await expect(openLaboratory).toHaveAttribute("href", /task=/);
  await expect(openLaboratory).toHaveAttribute("href", /expected=/);
  await openLaboratory.click();

  await expect(
    page.getByRole("heading", { name: "Carry the lesson task into this workspace" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to lesson" })).toBeVisible();
  await expect(page.getByText("Opening or visiting this workspace records no completion or mastery")).toBeVisible();

  await expect.poll(() => page.evaluate((expectedBlockId) => {
    const raw = localStorage.getItem("engineering-mastery-lab/progress/v5");
    if (!raw) return null;
    const progress = JSON.parse(raw) as {
      academy?: {
        unfinishedLabs?: Record<string, { status?: string; lastStepId?: string }>;
        lessonRecords?: Record<string, {
          requirements?: { appliedEvidenceSatisfied?: boolean };
        }>;
        skillRecords?: Record<string, unknown>;
      };
    };
    return {
      unfinished: progress.academy?.unfinishedLabs?.[expectedBlockId],
      applied:
        progress.academy?.lessonRecords?.["EML-E0-D01-L01"]
          ?.requirements?.appliedEvidenceSatisfied,
      skillCount: Object.keys(progress.academy?.skillRecords ?? {}).length
    };
  }, labBlockId)).toMatchObject({
    unfinished: {
      status: "in-progress",
      lastStepId: labBlockId
    },
    applied: false,
    skillCount: 0
  });

  const submit = page.getByRole("button", {
    name: "Record learner-attested evidence and satisfy applied task"
  });
  await expect(submit).toBeDisabled();
  await page.getByLabel("Observed or tool result").fill(
    "Input A produced a stable measured output of 4.2 V."
  );
  await expect(submit).toBeDisabled();
  await page.getByLabel("Acceptance-criterion comparison").fill(
    "The result was within 0.1 V of the expected 4.3 V outcome."
  );
  await expect(submit).toBeDisabled();
  await page.getByLabel("Evidence reference or trace").fill("done");
  await expect(submit).toBeDisabled();
  await page.getByLabel("Evidence reference or trace").fill("TEST-LAB-042");
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(
    page.getByText(
      "Learner-attested local evidence recorded. This is not independently verified proof. The unfinished handoff is cleared and the lesson gate is satisfied."
    )
  ).toBeVisible();
  await expect.poll(() => page.evaluate((expectedBlockId) => {
    const raw = localStorage.getItem("engineering-mastery-lab/progress/v5");
    if (!raw) return null;
    const progress = JSON.parse(raw) as {
      academy?: {
        unfinishedLabs?: Record<string, unknown>;
        lessonRecords?: Record<string, {
          requirements?: { appliedEvidenceSatisfied?: boolean };
        }>;
        skillRecords?: Record<string, {
          evidence?: Array<{
            kind?: string;
            referenceId?: string;
            summary?: string;
            passed?: boolean;
          }>;
        }>;
      };
    };
    const evidence = Object.values(progress.academy?.skillRecords ?? {})
      .flatMap((record) => record.evidence ?? [])
      .find((item) => item.referenceId === expectedBlockId);
    return {
      unfinished: progress.academy?.unfinishedLabs?.[expectedBlockId],
      applied:
        progress.academy?.lessonRecords?.["EML-E0-D01-L01"]
          ?.requirements?.appliedEvidenceSatisfied,
      evidence
    };
  }, labBlockId)).toMatchObject({
    unfinished: undefined,
    applied: true,
    evidence: {
      kind: "applied-evidence",
      referenceId: labBlockId,
      summary:
        "Evidence status: learner-attested local record; not independently verified.\n"
        + "Observed result: Input A produced a stable measured output of 4.2 V.\n"
        + "Acceptance-criterion comparison: The result was within 0.1 V of the expected 4.3 V outcome.\n"
        + "Evidence reference: TEST-LAB-042",
      passed: true
    }
  });

  await page.getByRole("link", { name: "Return to lesson" }).click();
  await expect(page.locator(`#${labBlockId}`)).toBeVisible();
  await expect(page.locator(".academy-laboratory-callout")).toContainText(
    "Learner-attested evidence recorded"
  );
});
