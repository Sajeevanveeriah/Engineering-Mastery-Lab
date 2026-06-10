// 2D differential-drive robot kinematics, odometry, waypoint following and A*.

export interface Pose {
  x: number;
  y: number;
  theta: number;
}

/** Integrate differential-drive kinematics one step (exact for constant inputs over dt). */
export function diffDriveStep(pose: Pose, vLeft: number, vRight: number, wheelBase: number, dt: number): Pose {
  const v = (vLeft + vRight) / 2;
  const w = (vRight - vLeft) / wheelBase;
  return {
    x: pose.x + v * Math.cos(pose.theta) * dt,
    y: pose.y + v * Math.sin(pose.theta) * dt,
    theta: normalizeAngle(pose.theta + w * dt)
  };
}

export function normalizeAngle(a: number): number {
  let r = a;
  while (r > Math.PI) r -= 2 * Math.PI;
  while (r < -Math.PI) r += 2 * Math.PI;
  return r;
}

/** Deterministic pseudo-random generator (mulberry32) so noisy odometry is reproducible. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Odometry update with multiplicative wheel noise. */
export function noisyOdometryStep(
  pose: Pose,
  vLeft: number,
  vRight: number,
  wheelBase: number,
  dt: number,
  noiseStd: number,
  rng: () => number
): Pose {
  const nl = 1 + gaussian(rng) * noiseStd;
  const nr = 1 + gaussian(rng) * noiseStd;
  return diffDriveStep(pose, vLeft * nl, vRight * nr, wheelBase, dt);
}

function gaussian(rng: () => number): number {
  // Box-Muller
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface WaypointCommand {
  vLeft: number;
  vRight: number;
  reached: boolean;
}

/** Simple proportional steer-to-waypoint controller. */
export function steerToWaypoint(
  pose: Pose,
  wx: number,
  wy: number,
  maxSpeed: number,
  kTurn: number,
  reachedRadius: number
): WaypointCommand {
  const dx = wx - pose.x;
  const dy = wy - pose.y;
  const dist = Math.hypot(dx, dy);
  if (dist < reachedRadius) return { vLeft: 0, vRight: 0, reached: true };
  const targetTheta = Math.atan2(dy, dx);
  const err = normalizeAngle(targetTheta - pose.theta);
  const forward = maxSpeed * Math.max(0.15, Math.cos(err));
  const turn = kTurn * err;
  return { vLeft: forward - turn, vRight: forward + turn, reached: false };
}

/** A* on a boolean grid (true = obstacle). Returns path of [row, col] or null. */
export function aStar(
  grid: boolean[][],
  start: [number, number],
  goal: [number, number]
): [number, number][] | null {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const key = (r: number, c: number) => r * cols + c;
  const open = new Map<number, [number, number]>();
  const g = new Map<number, number>();
  const f = new Map<number, number>();
  const came = new Map<number, number>();
  const h = (r: number, c: number) => Math.abs(r - goal[0]) + Math.abs(c - goal[1]);

  open.set(key(...start), start);
  g.set(key(...start), 0);
  f.set(key(...start), h(...start));

  while (open.size > 0) {
    let bestKey = -1;
    let bestF = Infinity;
    for (const [k] of open) {
      const fk = f.get(k) ?? Infinity;
      if (fk < bestF) {
        bestF = fk;
        bestKey = k;
      }
    }
    const [cr, cc] = open.get(bestKey)!;
    if (cr === goal[0] && cc === goal[1]) {
      const path: [number, number][] = [[cr, cc]];
      let k = bestKey;
      while (came.has(k)) {
        k = came.get(k)!;
        path.unshift([Math.floor(k / cols), k % cols]);
      }
      return path;
    }
    open.delete(bestKey);
    const neighbours: [number, number][] = [
      [cr - 1, cc],
      [cr + 1, cc],
      [cr, cc - 1],
      [cr, cc + 1]
    ];
    for (const [nr, nc] of neighbours) {
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc]) continue;
      const nk = key(nr, nc);
      const tentative = (g.get(bestKey) ?? Infinity) + 1;
      if (tentative < (g.get(nk) ?? Infinity)) {
        came.set(nk, bestKey);
        g.set(nk, tentative);
        f.set(nk, tentative + h(nr, nc));
        if (!open.has(nk)) open.set(nk, [nr, nc]);
      }
    }
  }
  return null;
}

/** Simple range check against circular obstacles for avoidance demos. */
export function nearestObstacleDistance(
  pose: Pose,
  obstacles: { x: number; y: number; r: number }[]
): number {
  let min = Infinity;
  for (const o of obstacles) {
    const d = Math.hypot(o.x - pose.x, o.y - pose.y) - o.r;
    if (d < min) min = d;
  }
  return min;
}
