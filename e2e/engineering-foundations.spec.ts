import { expect, test } from "@playwright/test";
import { documentOverflow, emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

const flagshipWorkflows = [
  {
    route: "/learn/flagships/controls",
    title: "Controls: response, saturation, and robustness"
  },
  {
    route: "/learn/flagships/robotics-autonomy",
    title: "Robotics and autonomy: localisation and trajectory tracking"
  },
  {
    route: "/learn/flagships/embedded-electronics-sensing",
    title: "Embedded electronics and sensing: sampling, timing, and faults"
  },
  {
    route: "/learn/flagships/mechanical-design-dynamics",
    title: "Mechanical design and dynamics: load, stress, deflection, and tolerance"
  },
  {
    route: "/learn/flagships/applied-ai-ml",
    title: "Applied AI and ML: split integrity, baselines, and limitations"
  }
] as const;

const machineFacingEngineeringLabels =
  /\b(?:rad-per-s2?|kg\.m2|angular-speed|angular-acceleration|rotational-inertia)\b/;

test.beforeEach(async ({ page }) => {
  await installProgress(page, emptyProgress);
});

test("motor sizing workspace exposes the deterministic SI operating points", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/engineering");

  await expect(page.getByRole("heading", { name: "Engineering project workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Continuous and peak motor requirements" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Baseline motor-sizing result" })).toBeVisible();
  const baselineTable = page.getByRole("table", { name: "Baseline motor-sizing result" });
  const continuousRow = baselineTable.getByRole("row", { name: /Continuous/ });
  await expect(continuousRow).toContainText("15.074813");
  await expect(continuousRow).toContainText("9.4217584");
  await expect(continuousRow).toContainText("1200");
  await expect(continuousRow).toContainText("125.66371");
  await expect(continuousRow).toContainText("1183.9731");
  const peakRow = baselineTable.getByRole("row", { name: /Peak/ });
  await expect(peakRow).toContainText("33");
  await expect(peakRow).toContainText("20.625");
  await expect(peakRow).toContainText("1200");
  await expect(peakRow).toContainText("125.66371");
  await expect(peakRow).toContainText("2591.8139");
  const variableTable = page.locator('section[aria-labelledby="kernel-variables-heading"] table');
  await expect(variableTable).not.toContainText(machineFacingEngineeringLabels);
  await expect(variableTable.getByRole("row", { name: /duty cycle/i })).not.toContainText(/\bone\b/);
  await expect(page.getByText("Motor product selection, thermal limits and manufacturer curves are outside this calculation.")).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("named scenario exposes changed inputs and recomputed outputs", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/engineering");
  await page.getByRole("button", { name: "Scenarios" }).click();

  await expect(page.getByRole("heading", { name: "Baseline and named scenario" })).toBeVisible();
  await expect(
    page.locator('section[aria-labelledby="scenario-heading"] select')
  ).toHaveValue("reduced-speed");
  await expect(page.getByRole("heading", { name: "Changed inputs" })).toBeVisible();
  const scenarioRegion = page.locator('section[aria-labelledby="scenario-heading"]');
  const changedInputsTable = scenarioRegion.getByRole("table").nth(0);
  const continuousInput = changedInputsTable.getByRole("row", { name: /Continuous output speed/ });
  await expect(continuousInput).toContainText("62.831853");
  await expect(continuousInput).toContainText("50.265482");
  await expect(continuousInput).toContainText("-12.566371");
  await expect(continuousInput).toContainText("-20%");
  const peakInput = changedInputsTable.getByRole("row", { name: /Peak output speed/ });
  await expect(peakInput).toContainText("62.831853");
  await expect(peakInput).toContainText("50.265482");
  await expect(peakInput).toContainText("-12.566371");
  await expect(peakInput).toContainText("-20%");
  await expect(changedInputsTable.getByRole("row", { name: /Continuous motor speed/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Changed outputs" })).toBeVisible();
  const changedOutputsTable = scenarioRegion.getByRole("table").nth(1);
  const continuousPower = changedOutputsTable.getByRole("row", { name: /Continuous motor power/ });
  await expect(continuousPower).toContainText("1183.9731");
  await expect(continuousPower).toContainText("947.17846");
  await expect(continuousPower).toContainText("-236.79462");
  await expect(continuousPower).toContainText("W");
  const continuousSpeed = changedOutputsTable.getByRole("row", { name: /Continuous motor speed/ });
  await expect(continuousSpeed).toContainText("1200");
  await expect(continuousSpeed).toContainText("960");
  await expect(continuousSpeed).toContainText("-240");
  await expect(continuousSpeed).toContainText("rpm");
  const peakSpeed = changedOutputsTable.getByRole("row", { name: /Peak motor speed/ });
  await expect(peakSpeed).toContainText("1200");
  await expect(peakSpeed).toContainText("960");
  await expect(peakSpeed).toContainText("-240");
  await expect(peakSpeed).toContainText("rpm");
  expect(runtimeErrors).toEqual([]);
});

test("dataset import previews and applies valid CSV while rejecting duplicate headings", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/engineering");
  await page.getByRole("button", { name: "Dataset" }).click();

  await page.getByRole("button", { name: "Validate preview" }).click();
  await expect(page.getByRole("status")).toContainText("Dataset validated: 2 rows and 3 columns");
  await expect(page.getByRole("table", { name: "Learner load data: 2 rows" })).toBeVisible();
  await expect(page.getByRole("row", { name: "continuous 10 600" })).toBeVisible();
  await page.getByRole("button", { name: "Add validated dataset" }).click();
  await expect(page.getByRole("status")).toContainText("Validated dataset added to the in-session project");

  await page.getByLabel("CSV content").fill("case,torque,torque\ncontinuous,10,20");
  await page.getByRole("button", { name: "Validate preview" }).click();
  await expect(page.getByRole("alert")).toContainText(/duplicate/i);
  await expect(page.getByRole("button", { name: "Add validated dataset" })).toBeDisabled();
  expect(runtimeErrors).toEqual([]);
});

test("notebook strips executable markup and retains the safe plain-text note", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/engineering");
  await page.getByRole("button", { name: "Notebook" }).click();

  await page.getByLabel("Plain-text reflection").fill(
    'Before <script>alert("unsafe")</script><b>after</b>'
  );
  await page.getByRole("button", { name: "Add sanitised note" }).click();

  await expect(page.getByRole("status")).toContainText("Plain-text notebook note added after sanitisation");
  await expect(page.locator("article").filter({ hasText: "Before after" })).toBeVisible();
  await expect(page.getByText('alert("unsafe")')).toHaveCount(0);
  await expect(page.locator("main#main-content script")).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test("evidence lineage presents a complete accessible graph alternative", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/engineering");
  await page.getByRole("button", { name: "Evidence lineage" }).click();

  await expect(page.getByRole("heading", { name: "Evidence lineage" })).toBeVisible();
  await expect(page.getByText("Every reference resolves and the directed lineage is acyclic.")).toBeVisible();
  const lineageTable = page.getByRole("table", { name: "Accessible evidence graph alternative" });
  await expect(lineageTable).toBeVisible();
  expect(await lineageTable.locator("tbody tr").count()).toBeGreaterThan(0);
  expect(runtimeErrors).toEqual([]);
});

test("saved engineering workspace persists in progress version 5 and appears in Prove", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/engineering");
  await page.getByRole("button", { name: "Save local record" }).click();

  await expect(page.getByRole("status")).toContainText("Validated project bundle saved locally and linked to Prove");
  const stored = await page.evaluate(() => {
    const text = localStorage.getItem("engineering-mastery-lab/progress/v5");
    return text ? JSON.parse(text) as {
      version?: number;
      engineeringWorkspaces?: Record<string, { projectId?: string; schemaVersion?: number }>;
    } : null;
  });
  expect(stored?.version).toBe(5);
  expect(stored?.engineeringWorkspaces?.["motor-sizing-study"]).toMatchObject({
    projectId: "motor-sizing-study",
    schemaVersion: 1
  });

  await page.goto("#/portfolio");
  await expect(page.getByRole("heading", { name: "Prove" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Motor sizing engineering record" })).toBeVisible();
  await expect(page.getByText("Validated local bundle retained")).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("Project Pack and deterministic report affordances retain integrity and limitations", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/engineering");
  await page.getByRole("button", { name: "Bundle and reports" }).click();

  await expect(page.getByRole("heading", { name: "Validated Project Pack" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Project Pack virtual-file manifest" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Project Pack" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview Project Pack import" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply validated Project Pack" })).toBeDisabled();

  await expect(page.getByRole("heading", { name: "Deterministic engineering report" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Markdown report" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export JSON report" })).toBeVisible();
  await page.getByText("Preview complete Markdown report").click();
  const reportPreview = page.locator("pre.report-preview");
  await expect(reportPreview).toContainText("# Engineering Report:");
  await expect(reportPreview).toContainText("## Known limits");
  await expect(reportPreview).not.toContainText(machineFacingEngineeringLabels);
  await expect.poll(() => reportPreview.evaluate((element) =>
    element.scrollWidth <= element.clientWidth + 1
  )).toBe(true);
  expect(runtimeErrors).toEqual([]);
});

test("the deterministic engineering report remains contained in print media", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("#/tools/engineering");
  await page.getByRole("button", { name: "Bundle and reports" }).click();
  await page.getByText("Preview complete Markdown report").click();
  await page.emulateMedia({ media: "print" });

  await expect(page.getByRole("heading", { name: "Deterministic engineering report" })).toBeVisible();
  await expect(page.locator("pre.report-preview")).toContainText("## Validation");
  await expect(page.getByRole("button", { name: "Print report view" })).toBeHidden();
  expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
});

for (const workflow of flagshipWorkflows) {
  test(`${workflow.route} exposes its complete deterministic learning workflow`, async ({ page }) => {
    const runtimeErrors = monitorRuntimeErrors(page);
    await page.goto(`#${workflow.route}`);

    await expect(page.getByRole("heading", { level: 1, name: workflow.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prerequisites and outcomes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /fixture$/ })).toBeVisible();
    await expect(page.getByRole("table", { name: "Accessible data alternative for the deterministic fixture" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deterministic workflow contract" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Challenge and pass criteria" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Text and table requirements" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Portfolio-ready output" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add kernel record to Prove" })).toBeEnabled();
    const kernelSnapshotRegion = page.getByRole("region", {
      name: "Validated kernel calculation snapshots"
    });
    await expect(kernelSnapshotRegion).not.toContainText(machineFacingEngineeringLabels);
    expect(await kernelSnapshotRegion.locator("dt").allTextContents()).toEqual(
      expect.arrayContaining(["Role", "Variable", "Display value", "SI value", "Dimension"])
    );
    const kernelOutputRegion = page.getByRole("region", {
      name: "Kernel-compatible output records"
    });
    expect(await kernelOutputRegion.locator("dt").allTextContents()).toEqual(
      expect.arrayContaining(["Record type", "Output", "Required fields"])
    );
    expect(await page.locator(".flagship-page th, .flagship-page td").evaluateAll((cells) =>
      cells.every((cell) => getComputedStyle(cell).overflowWrap !== "anywhere")
    )).toBe(true);
    const primaryColumn = page.locator(".flagship-page > .detail-columns > div");
    const evidenceRail = page.locator(".flagship-page > .detail-columns > aside");
    await expect(primaryColumn.getByRole("heading", { name: "Apply and retain evidence" })).toBeVisible();
    await expect(evidenceRail.getByRole("heading", { name: "Apply and retain evidence" })).toHaveCount(0);
    await expect(page.locator(".flagship-page .table-scroll-hint").first()).toBeHidden();
    const columnHeights = await Promise.all([
      primaryColumn.evaluate((element) => element.getBoundingClientRect().height),
      evidenceRail.evaluate((element) => element.getBoundingClientRect().height)
    ]);
    expect(columnHeights[0]).toBeGreaterThanOrEqual(columnHeights[1] - 1);
    await expect.poll(() => evidenceRail.evaluate((element) =>
      element.scrollWidth <= element.clientWidth + 1
    )).toBe(true);
    expect(runtimeErrors).toEqual([]);
  });

  test(`${workflow.route} keeps kernel records readable at 390 CSS px`, async ({ page }) => {
    const runtimeErrors = monitorRuntimeErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`#${workflow.route}`);

    const kernelSnapshotRegion = page.getByRole("region", {
      name: "Validated kernel calculation snapshots"
    });
    const kernelOutputRegion = page.getByRole("region", {
      name: "Kernel-compatible output records"
    });
    await expect(kernelSnapshotRegion).toBeVisible();
    await expect(kernelOutputRegion).toBeVisible();
    expect(await kernelSnapshotRegion.evaluate((element) =>
      element.scrollWidth <= element.clientWidth + 1
    )).toBe(true);
    expect(await kernelOutputRegion.evaluate((element) =>
      element.scrollWidth <= element.clientWidth + 1
    )).toBe(true);
    const tableRegions = page.locator(".flagship-page > .detail-columns > div .table-wrap");
    const tableCount = await tableRegions.count();
    expect(tableCount).toBeGreaterThan(0);
    await expect(page.locator(".flagship-page .table-scroll-hint:visible")).toHaveCount(tableCount);
    await expect(page.locator(".flagship-page .table-scroll-hint").first()).toHaveText(
      "Scroll horizontally to view all columns."
    );
    expect(await tableRegions.evaluateAll((regions) => regions.every((region) => {
      const hintId = region.getAttribute("aria-describedby");
      const hint = hintId ? document.getElementById(hintId) : null;
      return Boolean(hint)
        && getComputedStyle(hint as HTMLElement).display !== "none"
        && region.scrollWidth > region.clientWidth + 1;
    }))).toBe(true);
    await tableRegions.first().evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    expect(await tableRegions.first().evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const overflowState = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(overflowState.documentWidth).toBeLessThanOrEqual(overflowState.viewportWidth + 1);
    expect(runtimeErrors).toEqual([]);
  });
}

test("robotics flagship retains both canonical evidence and kernel records in Prove", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/learn/flagships/robotics-autonomy");
  await page.getByRole("button", { name: "Add kernel record to Prove" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Validated kernel project bundle and learner-generated fixture evidence were added to Prove"
  );
  await expect(page.getByRole("button", { name: "Kernel record saved" })).toBeDisabled();

  const stored = await page.evaluate(() => {
    const text = localStorage.getItem("engineering-mastery-lab/progress/v5");
    return text ? JSON.parse(text) as {
      manualEvidence?: Array<{ id?: string; linkedSkills?: string[] }>;
      engineeringWorkspaces?: Record<string, { projectId?: string }>;
    } : null;
  });
  expect(stored?.manualEvidence).toContainEqual(expect.objectContaining({
    id: "flagship-fixture-robotics-autonomy",
    linkedSkills: ["robotics"]
  }));
  expect(stored?.engineeringWorkspaces?.["robotics-autonomy-flagship"]).toMatchObject({
    projectId: "robotics-autonomy-flagship"
  });

  await page.goto("#/portfolio");
  const fixtureCard = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Robotics and autonomy: localisation and trajectory tracking deterministic fixture",
      exact: true
    })
  });
  await expect(fixtureCard).toContainText("Linked skills: Robotics");
  const kernelCard = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Robotics and autonomy deterministic kernel record",
      exact: true
    })
  });
  await expect(kernelCard).toContainText("Validated local bundle retained");
  await expect(kernelCard).toContainText("Linked skills: Robotics");
  expect(runtimeErrors).toEqual([]);
});

test("flagship disclosure, export, and Prove action are keyboard operable", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/learn/flagships/controls");

  const disclosure = page.locator("details summary").first();
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure.locator("xpath=..")).toHaveAttribute("open", "");

  const exportButton = page.getByRole("button", { name: "Export fixture" });
  await exportButton.focus();
  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^\d{8}-Controls-Workflow-Rev00\.json$/);

  const proveButton = page.getByRole("button", { name: "Add kernel record to Prove" });
  await proveButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "Validated kernel project bundle and learner-generated fixture evidence were added to Prove"
  );
  await expect(page.getByRole("button", { name: "Kernel record saved" })).toBeDisabled();
  expect(runtimeErrors).toEqual([]);
});

test("settings names every hosted capability as unavailable and exposes only local behaviour", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/settings");

  await expect(page.getByRole("heading", { name: "Current data and hosted capability boundary" })).toBeVisible();
  const hostedTable = page.getByRole("table", { name: "Hosted capabilities in this build" });
  await expect(hostedTable.getByRole("row", { name: /Identity Unavailable Guest or local profile only/ })).toBeVisible();
  await expect(hostedTable.getByRole("row", { name: /Synchronisation Unavailable Versioned export/ })).toBeVisible();
  await expect(hostedTable.getByRole("row", { name: /Billing Unavailable No payment form/ })).toBeVisible();
  await expect(hostedTable.getByRole("row", { name: /Collaboration Unavailable No multi-user session/ })).toBeVisible();
  await expect(hostedTable.getByRole("row", { name: /Educator services Unavailable Local synthetic cohort fixtures only/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in|subscribe|pay/i })).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});
