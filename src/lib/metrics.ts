// Domain scoring used by the dashboard and skills matrix.

import type { ProgressState } from "./storage";
import { skillDomains } from "../data/skills";

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
  const values = Object.values(progress.artefacts);
  return { done: values.filter(Boolean).length, total: values.length };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function round(v: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}
