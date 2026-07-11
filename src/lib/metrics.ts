// Domain scoring used by the dashboard and skills matrix.

import type { ProgressState } from "./storage";
import { skillDomains } from "../data/skills";
import { modules, type ModuleContent } from "../data/modules";

export interface DomainScore {
  domainId: string;
  name: string;
  /** 0..100 combined score from self-ratings and passed challenges. */
  score: number;
  ratedSkills: number;
  totalSkills: number;
}

export function domainScores(progress: ProgressState): DomainScore[] {
  return skillDomains.map((d) => {
    const ratings = d.levels.map((lvl) => progress.skillRatings[lvl.id]?.level ?? 0);
    const rated = ratings.filter((r) => r > 0).length;
    const avg = ratings.length === 0 ? 0 : ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return {
      domainId: d.id,
      name: d.name,
      score: Math.round((avg / 5) * 100),
      ratedSkills: rated,
      totalSkills: d.levels.length
    };
  });
}

/** Recommend the lowest-scoring domain that still has unrated or weak skills. */
export function recommendedDomain(progress: ProgressState): DomainScore | null {
  const scores = domainScores(progress);
  if (scores.length === 0) return null;
  return [...scores].sort((a, b) => a.score - b.score)[0];
}

export function challengePassCount(progress: ProgressState): number {
  return Object.values(progress.challenges).filter((c) => c.passed).length;
}

export function artefactCount(progress: ProgressState): { done: number; total: number } {
  const keys = modules.flatMap((module) => module.evidence.map((_, index) => `${module.id}-ev${index}`));
  return { done: keys.filter((key) => progress.artefacts[key]).length, total: keys.length };
}

export interface ModuleProgress {
  done: number;
  total: number;
  percent: number;
  challengesDone: number;
  challengesTotal: number;
  evidenceDone: number;
  evidenceTotal: number;
  reflectionDone: boolean;
}

export function moduleProgress(progress: ProgressState, module: ModuleContent): ModuleProgress {
  const challengesDone = module.challenges.filter((challenge) => progress.challenges[challenge.id]?.passed).length;
  const evidenceDone = module.evidence.filter((_, index) => progress.artefacts[`${module.id}-ev${index}`]).length;
  const reflectionDone = Boolean(progress.reflections[module.id]?.trim());
  const total = module.challenges.length + module.evidence.length + 1;
  const done = challengesDone + evidenceDone + Number(reflectionDone);
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    challengesDone,
    challengesTotal: module.challenges.length,
    evidenceDone,
    evidenceTotal: module.evidence.length,
    reflectionDone
  };
}

export interface OverallProgress {
  done: number;
  total: number;
  percent: number;
  ratedSkills: number;
  totalSkills: number;
  completedModules: number;
  totalModules: number;
}

export function overallProgress(progress: ProgressState): OverallProgress {
  const moduleStats = modules.map((module) => moduleProgress(progress, module));
  const ratedSkills = skillDomains.flatMap((domain) => domain.levels).filter(
    (level) => (progress.skillRatings[level.id]?.level ?? 0) > 0
  ).length;
  const totalSkills = skillDomains.reduce((sum, domain) => sum + domain.levels.length, 0);
  const moduleDone = moduleStats.reduce((sum, stat) => sum + stat.done, 0);
  const moduleTotal = moduleStats.reduce((sum, stat) => sum + stat.total, 0);
  const done = moduleDone + ratedSkills;
  const total = moduleTotal + totalSkills;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    ratedSkills,
    totalSkills,
    completedModules: moduleStats.filter((stat) => stat.percent === 100).length,
    totalModules: modules.length
  };
}

export function sprintProgress(progress: ProgressState, itemIds: string[]): { done: number; total: number; percent: number } {
  const done = itemIds.filter((id) => progress.sprintChecklist[id]).length;
  return { done, total: itemIds.length, percent: itemIds.length === 0 ? 0 : Math.round((done / itemIds.length) * 100) };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function round(v: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}
