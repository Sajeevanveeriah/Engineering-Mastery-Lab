export const planIds = ["free", "pro", "teams-educators"] as const;
export type PlanId = typeof planIds[number];

export const entitlementIds = [
  "starter-learning",
  "full-learning-catalogue",
  "advanced-project-templates",
  "cloud-sync",
  "enhanced-portfolio-exports",
  "assessment-completion-records",
  "ai-tutor",
  "team-cohort-dashboard"
] as const;
export type EntitlementId = typeof entitlementIds[number];

export interface PlanDefinition {
  id: PlanId;
  name: string;
  audience: string;
  futurePrice: string;
  entitlements: EntitlementId[];
}

export const plans: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    audience: "Independent learners exploring core laboratories and local evidence.",
    futurePrice: "Current open-source preview",
    entitlements: ["starter-learning"]
  },
  {
    id: "pro",
    name: "Pro",
    audience: "Individual engineers seeking hosted convenience, full projects, and richer exports.",
    futurePrice: "Future hosted offering - price not set",
    entitlements: ["starter-learning", "full-learning-catalogue", "advanced-project-templates", "cloud-sync", "enhanced-portfolio-exports", "assessment-completion-records", "ai-tutor"]
  },
  {
    id: "teams-educators",
    name: "Teams or Educators",
    audience: "Cohorts needing shared delivery, assessment workflows, and implementation support.",
    futurePrice: "Future hosted offering - contact model not connected",
    entitlements: [...entitlementIds]
  }
];
