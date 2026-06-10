// Mechanical and dynamics calculation engine.

export interface GearResult {
  ratio: number;
  outputSpeed: number;
  outputTorque: number;
}

/** Gear ratio from tooth counts; assumes ideal (lossless) mesh. */
export function gearRatio(teethIn: number, teethOut: number, inputSpeed: number, inputTorque: number): GearResult {
  const ratio = teethIn === 0 ? 0 : teethOut / teethIn;
  return {
    ratio,
    outputSpeed: ratio === 0 ? 0 : inputSpeed / ratio,
    outputTorque: inputTorque * ratio
  };
}

/** Mechanical power (W) from torque (Nm) and speed (rpm). */
export function powerFromTorque(torqueNm: number, speedRpm: number): number {
  return (torqueNm * speedRpm * 2 * Math.PI) / 60;
}

export interface SmdParams {
  mass: number;
  stiffness: number;
  damping: number;
  x0: number;
  v0: number;
  duration: number;
  dt: number;
}

export interface SmdResult {
  naturalFreqHz: number;
  dampingRatio: number;
  points: { t: number; x: number }[];
}

/** Free response of a spring-mass-damper via semi-implicit Euler. */
export function springMassDamper(p: SmdParams): SmdResult {
  const wn = Math.sqrt(p.stiffness / p.mass);
  const zeta = p.damping / (2 * Math.sqrt(p.stiffness * p.mass));
  let x = p.x0;
  let v = p.v0;
  const points: { t: number; x: number }[] = [];
  const n = Math.round(p.duration / p.dt);
  for (let i = 0; i <= n; i++) {
    points.push({ t: i * p.dt, x });
    const a = (-p.stiffness * x - p.damping * v) / p.mass;
    v += a * p.dt;
    x += v * p.dt;
  }
  return { naturalFreqHz: wn / (2 * Math.PI), dampingRatio: zeta, points };
}

/** Natural frequency (Hz) of a mass-spring system. */
export function naturalFrequencyHz(mass: number, stiffness: number): number {
  return Math.sqrt(stiffness / mass) / (2 * Math.PI);
}
