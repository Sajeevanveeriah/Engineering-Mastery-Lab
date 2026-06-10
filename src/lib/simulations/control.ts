// PID control simulation engine. All functions are pure so they can be unit
// tested and reused by any UI.

export type PlantType = "first-order" | "second-order";

export interface PidParams {
  kp: number;
  ki: number;
  kd: number;
  setpoint: number;
  /** Constant disturbance added to the plant input from t = disturbanceTime. */
  disturbance: number;
  disturbanceTime: number;
  /** First-order time constant, or used to derive second-order natural frequency. */
  tau: number;
  /** Damping ratio (second-order plant only). */
  zeta: number;
  plant: PlantType;
  dt: number;
  duration: number;
  /** Actuator saturation limits. */
  uMin: number;
  uMax: number;
}

export interface SimPoint {
  t: number;
  pv: number;
  sp: number;
  u: number;
}

export interface StepMetrics {
  overshootPct: number;
  riseTime: number | null;
  settlingTime: number | null;
  steadyStateError: number;
}

export const defaultPidParams: PidParams = {
  kp: 2,
  ki: 0.5,
  kd: 0.1,
  setpoint: 1,
  disturbance: 0,
  disturbanceTime: 10,
  tau: 1.5,
  zeta: 0.4,
  plant: "first-order",
  dt: 0.02,
  duration: 20,
  uMin: -10,
  uMax: 10
};

/** Simulate a PID loop against a first- or second-order plant (Euler integration). */
export function simulatePid(p: PidParams): SimPoint[] {
  const n = Math.max(1, Math.round(p.duration / p.dt));
  const out: SimPoint[] = [];
  let y = 0; // process variable
  let ydot = 0; // velocity state (second-order)
  let integral = 0;
  let prevError = p.setpoint - y;

  for (let i = 0; i <= n; i++) {
    const t = i * p.dt;
    const error = p.setpoint - y;
    integral += error * p.dt;
    const derivative = (error - prevError) / p.dt;
    prevError = error;

    let u = p.kp * error + p.ki * integral + p.kd * derivative;
    if (u > p.uMax) {
      u = p.uMax;
      integral -= error * p.dt; // basic anti-windup: stop integrating at saturation
    } else if (u < p.uMin) {
      u = p.uMin;
      integral -= error * p.dt;
    }

    const d = t >= p.disturbanceTime ? p.disturbance : 0;
    const input = u + d;

    if (p.plant === "first-order") {
      // tau * dy/dt + y = input
      y += ((input - y) / p.tau) * p.dt;
    } else {
      // y'' + 2*zeta*wn*y' + wn^2*y = wn^2*input, with wn = 1/tau
      const wn = 1 / p.tau;
      const yddot = wn * wn * (input - y) - 2 * p.zeta * wn * ydot;
      ydot += yddot * p.dt;
      y += ydot * p.dt;
    }

    out.push({ t, pv: y, sp: p.setpoint, u });
  }
  return out;
}

/** Step-response metrics for a 0 -> setpoint step, using a 2% settling band. */
export function stepMetrics(points: SimPoint[], setpoint: number): StepMetrics {
  if (points.length === 0 || setpoint === 0) {
    return { overshootPct: 0, riseTime: null, settlingTime: null, steadyStateError: setpoint };
  }
  const peak = Math.max(...points.map((pt) => pt.pv * Math.sign(setpoint)));
  const target = Math.abs(setpoint);
  const overshootPct = Math.max(0, ((peak - target) / target) * 100);

  // Rise time: 10% to 90% of setpoint.
  let t10: number | null = null;
  let t90: number | null = null;
  for (const pt of points) {
    const frac = (pt.pv * Math.sign(setpoint)) / target;
    if (t10 === null && frac >= 0.1) t10 = pt.t;
    if (t90 === null && frac >= 0.9) t90 = pt.t;
    if (t10 !== null && t90 !== null) break;
  }
  const riseTime = t10 !== null && t90 !== null ? t90 - t10 : null;

  // Settling time: last time the response leaves the +/-2% band.
  const band = 0.02 * target;
  let settlingTime: number | null = points[0].t;
  for (const pt of points) {
    if (Math.abs(pt.pv - setpoint) > band) settlingTime = null;
    else if (settlingTime === null) settlingTime = pt.t;
  }

  const last = points[points.length - 1];
  return { overshootPct, riseTime, settlingTime, steadyStateError: setpoint - last.pv };
}
