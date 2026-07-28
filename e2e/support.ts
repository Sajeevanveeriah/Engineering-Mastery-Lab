import type { Page } from "@playwright/test";

export interface ProgressFixture {
  version: 2;
  skillRatings: Record<string, { level: number; evidence: string }>;
  challenges: Record<string, { passed: boolean; completedAt: string; notes?: string }>;
  reflections: Record<string, string>;
  artefacts: Record<string, boolean>;
  sprintChecklist: Record<string, boolean>;
  theme: "light" | "dark";
  profile: {
    version: 1;
    displayName?: string;
    goal: "foundations" | "role" | "refresh" | "project";
    disciplines: string[];
    experience: "foundation" | "intermediate" | "advanced";
    weeklyEffortHours: number;
    recommendedPathwayId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  onboardingComplete: boolean;
  pathways: Record<string, {
    status: "enrolled" | "completed";
    enrolledAt: string;
    lastStepId: string;
    completedStepIds: string[];
  }>;
  labPositions: Record<string, {
    stageId: string;
    visitedStageIds: string[];
    updatedAt: string;
  }>;
  bookmarks: Record<string, boolean>;
  recentItems: Array<{
    id: string;
    type: "lab" | "pathway" | "project" | "tool" | "skill";
    title: string;
    route: string;
    visitedAt: string;
  }>;
  projects: Record<string, {
    status: "active" | "paused" | "completed";
    startedAt: string;
    updatedAt: string;
    completedMilestoneIds: string[];
    checkedEvidenceIds: string[];
    notes: string;
  }>;
  manualEvidence: Array<{
    id: string;
    title: string;
    description: string;
    url?: string;
    linkedSkills: string[];
    discipline: string;
    createdAt: string;
  }>;
  achievements: string[];
  accessibility: { reducedMotion: boolean; highContrast: boolean };
  legacy: Record<string, unknown>;
}

const fixedTime = "2026-07-01T02:00:00.000Z";

export const emptyProgress: ProgressFixture = {
  version: 2,
  skillRatings: {},
  challenges: {},
  reflections: {},
  artefacts: {},
  sprintChecklist: {},
  theme: "light",
  profile: null,
  onboardingComplete: true,
  pathways: {},
  labPositions: {},
  bookmarks: {},
  recentItems: [],
  projects: {},
  manualEvidence: [],
  achievements: [],
  accessibility: { reducedMotion: false, highContrast: false },
  legacy: {}
};

export const seededProgress: ProgressFixture = {
  ...structuredClone(emptyProgress),
  profile: {
    version: 1,
    displayName: "Saj",
    goal: "project",
    disciplines: ["Robotics", "Controls"],
    experience: "advanced",
    weeklyEffortHours: 6,
    recommendedPathwayId: "controls",
    createdAt: fixedTime,
    updatedAt: fixedTime
  },
  pathways: {
    controls: {
      status: "enrolled",
      enrolledAt: fixedTime,
      lastStepId: "lab-pid",
      completedStepIds: ["lab-mechanical"]
    }
  },
  labPositions: {
    pid: {
      stageId: "simulate",
      visitedStageIds: ["learn", "simulate"],
      updatedAt: fixedTime
    }
  },
  recentItems: [
    {
      id: "pid",
      type: "lab",
      title: "PID Control Lab",
      route: "/learn/labs/pid",
      visitedAt: fixedTime
    },
    {
      id: "cad-studio",
      type: "tool",
      title: "CAD Studio",
      route: "/tools/cad",
      visitedAt: "2026-06-30T02:00:00.000Z"
    }
  ],
  challenges: {
    "pid-c1": {
      passed: true,
      completedAt: fixedTime,
      notes: "Verified the steady-state response against the displayed criterion."
    }
  },
  artefacts: {
    "pid-ev0": true
  },
  reflections: {
    pid: "The response metrics made the proportional and integral trade-off explicit."
  },
  projects: {
    "temperature-controller": {
      status: "active",
      startedAt: fixedTime,
      updatedAt: fixedTime,
      completedMilestoneIds: ["requirements"],
      checkedEvidenceIds: ["Requirements table"],
      notes: "Plant assumptions recorded; tuning evidence remains in progress."
    }
  },
  manualEvidence: [
    {
      id: "manual-control-review",
      title: "Closed-loop response review",
      description: "Compared nominal and disturbed response plots against stated limits.",
      linkedSkills: ["controls-l1"],
      discipline: "Controls",
      createdAt: fixedTime
    }
  ],
  skillRatings: {
    "controls-l1": {
      level: 1,
      evidence: "A checked response plot and calculation record."
    }
  }
};

export async function installProgress(page: Page, progress: ProgressFixture): Promise<void> {
  await page.addInitScript((fixture) => {
    localStorage.setItem("engineering-mastery-lab/progress/v2", JSON.stringify(fixture));
  }, progress);
}

export function monitorRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

export async function documentOverflow(page: Page): Promise<number> {
  return page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
}
