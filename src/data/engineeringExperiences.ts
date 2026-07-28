export interface FlagshipCatalogueItem {
  id: string;
  title: string;
  summary: string;
  disciplines: string[];
  route: string;
  linkedLabRoute: string;
  linkedProjectRoute: string;
}

export const flagshipCatalogue: FlagshipCatalogueItem[] = [
  {
    id: "controls",
    title: "Controls and dynamic systems",
    summary: "Model first-order and second-order response, diagnose PID saturation, and retain measurable evidence.",
    disciplines: ["Controls", "Dynamic systems"],
    route: "/learn/flagships/controls",
    linkedLabRoute: "/learn/labs/pid",
    linkedProjectRoute: "/projects/temperature-controller"
  },
  {
    id: "robotics-autonomy",
    title: "Robotics and autonomy",
    summary: "Reconcile differential-drive motion, odometry uncertainty, deterministic fusion, and tracking failures.",
    disciplines: ["Robotics", "Autonomy"],
    route: "/learn/flagships/robotics-autonomy",
    linkedLabRoute: "/learn/labs/robotics",
    linkedProjectRoute: "/projects/mobile-robot"
  },
  {
    id: "embedded-electronics-sensing",
    title: "Embedded electronics and sensing",
    summary: "Trace a sensor signal through sampling, quantisation, filtering, timing, state logic, and fault handling.",
    disciplines: ["Embedded", "Electronics", "Sensing"],
    route: "/learn/flagships/embedded-electronics-sensing",
    linkedLabRoute: "/learn/labs/embedded",
    linkedProjectRoute: "/projects/sensor-data-logger"
  },
  {
    id: "mechanical-design-dynamics",
    title: "Mechanical design and dynamics",
    summary: "Connect loads, torque, power, inertia, stress, deflection, tolerance, and model limitations.",
    disciplines: ["Mechanical design", "Dynamics"],
    route: "/learn/flagships/mechanical-design-dynamics",
    linkedLabRoute: "/learn/labs/mechanical",
    linkedProjectRoute: "/projects/motor-gearbox"
  },
  {
    id: "applied-ai-ml",
    title: "Applied AI and machine learning",
    summary: "Use provenance-aware splits, transparent baselines, held-out metrics, residuals, and model limitations.",
    disciplines: ["AI and ML", "Data"],
    route: "/learn/flagships/applied-ai-ml",
    linkedLabRoute: "/learn/labs/ml",
    linkedProjectRoute: "/projects/predictive-maintenance"
  }
];

export const engineeringWorkspaceCatalogueItem = {
  id: "engineering-workspace",
  title: "Engineering project workspace",
  description: "Build versioned variables, datasets, scenarios, notebook records, evidence lineage, project bundles, packs, and reproducible reports locally.",
  route: "/tools/engineering",
  capability: "Web and Desktop" as const
};
