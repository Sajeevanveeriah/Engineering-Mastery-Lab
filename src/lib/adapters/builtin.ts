// Built-in adapters: expose the existing pure TypeScript simulation engines
// through the same adapter contract as external tools. They run in-process —
// never through process execution or serialisation.

import { simulatePid, stepMetrics, defaultPidParams, PidParams } from "../simulations/control";
import { rcCharge, rcCutoffHz, rlcStepResponse } from "../simulations/electrical";
import { springMassDamper, SmdParams } from "../simulations/mechanical";
import { fitLinearRegression, predictLinear, meanSquaredError, rSquared } from "../simulations/ml";
import { tankStep, defaultTankConfig, TankState } from "../simulations/plc";
import { diffDriveStep, Pose } from "../simulations/robotics";
import { pollingLatency, interruptLatency } from "../simulations/embedded";
import {
  ADAPTER_CONTRACT_VERSION,
  AdapterInfo,
  AdapterRequest,
  AdapterResult,
  Capability,
  DetectionResult,
  EngineAdapter,
  ExecutionContext,
  ValidationIssue,
  failureResult
} from "./contract";

type CapabilityImpl = {
  capability: Capability;
  validate: (params: Record<string, unknown>) => ValidationIssue[];
  run: (params: Record<string, unknown>) => Pick<AdapterResult, "tables" | "scalars"> & { message: string };
};

/** Shared implementation for all built-in engines. */
class BuiltinAdapter implements EngineAdapter {
  readonly contractVersion = ADAPTER_CONTRACT_VERSION;

  constructor(
    private id: string,
    private name: string,
    private impls: CapabilityImpl[]
  ) {}

  describe(): AdapterInfo {
    return {
      id: this.id,
      name: this.name,
      kind: "builtin",
      contractVersion: ADAPTER_CONTRACT_VERSION,
      capabilities: this.impls.map((i) => i.capability)
    };
  }

  async detect(): Promise<DetectionResult> {
    return { ready: true, version: "built-in" };
  }

  validate(request: AdapterRequest): ValidationIssue[] {
    const impl = this.impls.find((i) => i.capability.id === request.capabilityId);
    if (!impl) return [{ severity: "error", message: `Unknown capability "${request.capabilityId}".` }];
    return impl.validate(request.params);
  }

  async execute(request: AdapterRequest, _ctx: ExecutionContext): Promise<AdapterResult> {
    const impl = this.impls.find((i) => i.capability.id === request.capabilityId);
    if (!impl) {
      return failureResult(request.capabilityId, "invalid-input", `Unknown capability "${request.capabilityId}".`);
    }
    const issues = impl.validate(request.params);
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length > 0) {
      return failureResult(request.capabilityId, "invalid-input", errors.map((e) => e.message).join(" "), {
        diagnostics: issues.map((i) => ({ severity: i.severity, message: i.message, source: "validator" }))
      });
    }
    const started = performance.now();
    try {
      const { tables, scalars, message } = impl.run(request.params);
      return {
        status: "ok",
        capabilityId: request.capabilityId,
        message,
        tables,
        scalars,
        diagnostics: [],
        generatedFiles: [],
        durationMs: performance.now() - started,
        toolVersion: "built-in"
      };
    } catch (err) {
      return failureResult(
        request.capabilityId,
        "failed",
        `Built-in simulation failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

function num(params: Record<string, unknown>, key: string, fallback: number): number {
  const v = params[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function requirePositive(params: Record<string, unknown>, keys: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const key of keys) {
    const v = params[key];
    if (v !== undefined && (typeof v !== "number" || !Number.isFinite(v) || v <= 0)) {
      issues.push({ severity: "error", message: `Parameter "${key}" must be a positive finite number.`, field: key });
    }
  }
  return issues;
}

export function createBuiltinAdapters(): EngineAdapter[] {
  const control = new BuiltinAdapter("builtin-control", "Control (PID)", [
    {
      capability: {
        id: "builtin-control.pid-step",
        title: "PID step response",
        description: "Closed-loop PID step response against a first- or second-order plant with step metrics."
      },
      validate: (p) => requirePositive(p, ["tau", "dt", "duration"]),
      run: (p) => {
        const params: PidParams = {
          ...defaultPidParams,
          kp: num(p, "kp", defaultPidParams.kp),
          ki: num(p, "ki", defaultPidParams.ki),
          kd: num(p, "kd", defaultPidParams.kd),
          setpoint: num(p, "setpoint", defaultPidParams.setpoint),
          tau: num(p, "tau", defaultPidParams.tau),
          dt: num(p, "dt", defaultPidParams.dt),
          duration: num(p, "duration", defaultPidParams.duration)
        };
        const points = simulatePid(params);
        const metrics = stepMetrics(points, params.setpoint);
        return {
          message: `PID step response simulated (${points.length} samples).`,
          tables: [
            {
              title: "PID step response",
              columns: [
                { name: "t", unit: "s", values: points.map((pt) => pt.t) },
                { name: "pv", values: points.map((pt) => pt.pv) },
                { name: "sp", values: points.map((pt) => pt.sp) },
                { name: "u", values: points.map((pt) => pt.u) }
              ]
            }
          ],
          scalars: {
            overshootPct: metrics.overshootPct,
            riseTime: metrics.riseTime ?? NaN,
            settlingTime: metrics.settlingTime ?? NaN,
            steadyStateError: metrics.steadyStateError
          }
        };
      }
    }
  ]);

  const electrical = new BuiltinAdapter("builtin-electrical", "Electrical (analytic)", [
    {
      capability: {
        id: "builtin-electrical.rc-charge",
        title: "RC charging curve",
        description: "Capacitor charging voltage v(t) = Vs(1 - e^(-t/RC))."
      },
      validate: (p) => requirePositive(p, ["r", "c", "duration"]),
      run: (p) => {
        const r = num(p, "r", 1000);
        const c = num(p, "c", 1e-6);
        const vs = num(p, "vs", 5);
        const duration = num(p, "duration", 5 * r * c);
        const points = rcCharge(vs, r, c, duration);
        return {
          message: "RC charging curve computed analytically.",
          tables: [
            {
              title: "RC charge",
              columns: [
                { name: "t", unit: "s", values: points.map((pt) => pt.t) },
                { name: "v", unit: "V", values: points.map((pt) => pt.v) }
              ]
            }
          ],
          scalars: { tau: r * c, cutoffHz: rcCutoffHz(r, c) }
        };
      }
    },
    {
      capability: {
        id: "builtin-electrical.rlc-step",
        title: "Series RLC step response",
        description: "Analytic capacitor-voltage step response of a series RLC circuit."
      },
      validate: (p) => requirePositive(p, ["r", "l", "c", "duration"]),
      run: (p) => {
        const r = num(p, "r", 100);
        const l = num(p, "l", 0.1);
        const c = num(p, "c", 1e-6);
        const vs = num(p, "vs", 5);
        const duration = num(p, "duration", 0.01);
        const res = rlcStepResponse(vs, r, l, c, duration);
        return {
          message: `RLC step response (${res.regime}).`,
          tables: [
            {
              title: "RLC step response",
              columns: [
                { name: "t", unit: "s", values: res.points.map((pt) => pt.t) },
                { name: "v", unit: "V", values: res.points.map((pt) => pt.v) }
              ]
            }
          ],
          scalars: { omega0: res.omega0, zeta: res.zeta }
        };
      }
    }
  ]);

  const mechanical = new BuiltinAdapter("builtin-mechanical", "Mechanical (vibration)", [
    {
      capability: {
        id: "builtin-mechanical.spring-mass-damper",
        title: "Spring-mass-damper free response",
        description: "Free vibration of a spring-mass-damper from initial conditions."
      },
      validate: (p) => requirePositive(p, ["mass", "stiffness", "duration", "dt"]),
      run: (p) => {
        const params: SmdParams = {
          mass: num(p, "mass", 1),
          stiffness: num(p, "stiffness", 100),
          damping: num(p, "damping", 2),
          x0: num(p, "x0", 0.1),
          v0: num(p, "v0", 0),
          duration: num(p, "duration", 5),
          dt: num(p, "dt", 0.005)
        };
        const res = springMassDamper(params);
        return {
          message: "Spring-mass-damper free response simulated.",
          tables: [
            {
              title: "Displacement",
              columns: [
                { name: "t", unit: "s", values: res.points.map((pt) => pt.t) },
                { name: "x", unit: "m", values: res.points.map((pt) => pt.x) }
              ]
            }
          ],
          scalars: { naturalFreqHz: res.naturalFreqHz, dampingRatio: res.dampingRatio }
        };
      }
    }
  ]);

  const ml = new BuiltinAdapter("builtin-ml", "Machine learning (regression)", [
    {
      capability: {
        id: "builtin-ml.linear-regression",
        title: "Linear regression fit",
        description: "Least-squares line fit with MSE and R² over supplied x/y arrays."
      },
      validate: (p) => {
        const xs = p.xs;
        const ys = p.ys;
        if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length < 2 || xs.length !== ys.length) {
          return [{ severity: "error", message: "Parameters xs and ys must be equal-length numeric arrays (n >= 2)." }];
        }
        return [];
      },
      run: (p) => {
        const xs = (p.xs as number[]).map(Number);
        const ys = (p.ys as number[]).map(Number);
        const model = fitLinearRegression(xs, ys);
        const preds = xs.map((x) => predictLinear(model, x));
        return {
          message: `Fitted y = ${model.slope.toFixed(4)}x + ${model.intercept.toFixed(4)}.`,
          tables: [
            {
              title: "Fit",
              columns: [
                { name: "x", values: xs },
                { name: "y", values: ys },
                { name: "yPred", values: preds }
              ]
            }
          ],
          scalars: {
            slope: model.slope,
            intercept: model.intercept,
            mse: meanSquaredError(ys, preds),
            r2: rSquared(ys, preds)
          }
        };
      }
    }
  ]);

  const plc = new BuiltinAdapter("builtin-plc", "PLC process (tank)", [
    {
      capability: {
        id: "builtin-plc.tank-fill",
        title: "Tank fill with interlocks",
        description: "Tank level simulation with high/low alarms and latched high-high trip."
      },
      validate: (p) => requirePositive(p, ["duration", "dt"]),
      run: (p) => {
        const duration = num(p, "duration", 20);
        const dt = num(p, "dt", 0.1);
        let state: TankState = {
          level: num(p, "initialLevel", 20),
          fillValveOpen: true,
          drainValveOpen: false,
          highAlarm: false,
          lowAlarm: false,
          highHighTrip: false
        };
        const t: number[] = [];
        const level: number[] = [];
        const steps = Math.round(duration / dt);
        let tripTime = NaN;
        for (let i = 0; i <= steps; i++) {
          t.push(i * dt);
          level.push(state.level);
          const next = tankStep(state, defaultTankConfig, dt);
          if (!state.highHighTrip && next.highHighTrip) tripTime = i * dt;
          state = next;
        }
        return {
          message: state.highHighTrip
            ? `Tank tripped high-high at t = ${tripTime.toFixed(1)} s; fill valve latched closed.`
            : "Tank simulation completed without a high-high trip.",
          tables: [
            {
              title: "Tank level",
              columns: [
                { name: "t", unit: "s", values: t },
                { name: "level", unit: "%", values: level }
              ]
            }
          ],
          scalars: { finalLevel: state.level, tripTime }
        };
      }
    }
  ]);

  const robotics = new BuiltinAdapter("builtin-robotics", "Robotics (differential drive)", [
    {
      capability: {
        id: "builtin-robotics.diff-drive",
        title: "Differential-drive trajectory",
        description: "Pose integration of a differential-drive robot with constant wheel speeds."
      },
      validate: (p) => requirePositive(p, ["wheelBase", "duration", "dt"]),
      run: (p) => {
        const vLeft = num(p, "vLeft", 0.5);
        const vRight = num(p, "vRight", 0.6);
        const wheelBase = num(p, "wheelBase", 0.3);
        const duration = num(p, "duration", 10);
        const dt = num(p, "dt", 0.05);
        let pose: Pose = { x: 0, y: 0, theta: 0 };
        const t: number[] = [];
        const xs: number[] = [];
        const ys: number[] = [];
        const steps = Math.round(duration / dt);
        for (let i = 0; i <= steps; i++) {
          t.push(i * dt);
          xs.push(pose.x);
          ys.push(pose.y);
          pose = diffDriveStep(pose, vLeft, vRight, wheelBase, dt);
        }
        return {
          message: "Differential-drive trajectory integrated.",
          tables: [
            {
              title: "Trajectory",
              columns: [
                { name: "t", unit: "s", values: t },
                { name: "x", unit: "m", values: xs },
                { name: "y", unit: "m", values: ys }
              ]
            }
          ],
          scalars: { finalX: pose.x, finalY: pose.y, finalTheta: pose.theta }
        };
      }
    }
  ]);

  const embedded = new BuiltinAdapter("builtin-embedded", "Embedded (timing)", [
    {
      capability: {
        id: "builtin-embedded.latency",
        title: "Polling vs interrupt latency",
        description: "Worst/average response latency for polling and interrupt-driven handling."
      },
      validate: (p) => requirePositive(p, ["pollPeriod", "handlerTime", "isrOverhead"]),
      run: (p) => {
        const pollPeriod = num(p, "pollPeriod", 1);
        const handlerTime = num(p, "handlerTime", 0.2);
        const isrOverhead = num(p, "isrOverhead", 0.05);
        const poll = pollingLatency(pollPeriod, handlerTime);
        const irq = interruptLatency(isrOverhead, handlerTime);
        return {
          message: "Latency comparison computed.",
          tables: [],
          scalars: {
            pollWorst: poll.worstCase,
            pollAverage: poll.average,
            interruptWorst: irq.worstCase,
            interruptAverage: irq.average
          }
        };
      }
    }
  ]);

  return [control, electrical, mechanical, ml, plc, robotics, embedded];
}
