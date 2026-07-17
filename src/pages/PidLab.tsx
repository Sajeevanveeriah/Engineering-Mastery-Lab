import { useMemo, useState } from "react";
import { ModuleShell } from "../components/ModuleShell";
import { Slider } from "../components/Slider";
import { LinePlot } from "../components/LinePlot";
import { moduleById } from "../data/modules";
import { defaultPidParams, simulatePid, stepMetrics, type PidParams } from "../lib/simulations/control";
import { round } from "../lib/metrics";

function Simulator() {
  const [p, setP] = useState<PidParams>(defaultPidParams);
  const set = (patch: Partial<PidParams>) => setP((prev) => ({ ...prev, ...patch }));

  const points = useMemo(() => simulatePid(p), [p]);
  const m = useMemo(() => stepMetrics(points, p.setpoint), [points, p.setpoint]);

  return (
    <div className="lab-layout">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Controller & plant</h3>
        <label htmlFor="plant-select">Plant model</label>
        <select
          id="plant-select"
          value={p.plant}
          onChange={(e) => set({ plant: e.target.value as PidParams["plant"] })}
          style={{ marginBottom: "0.6rem", width: "100%" }}
        >
          <option value="first-order">First-order (τ·dy/dt + y = u)</option>
          <option value="second-order">Second-order (ωn = 1/τ, damping ζ)</option>
        </select>
        <Slider label="Kp" value={p.kp} min={0} max={20} step={0.1} onChange={(v) => set({ kp: v })} />
        <Slider label="Ki" value={p.ki} min={0} max={10} step={0.05} onChange={(v) => set({ ki: v })} />
        <Slider label="Kd" value={p.kd} min={0} max={5} step={0.05} onChange={(v) => set({ kd: v })} />
        <Slider label="Setpoint" value={p.setpoint} min={0.2} max={3} step={0.1} onChange={(v) => set({ setpoint: v })} />
        <Slider label="Plant time constant τ" value={p.tau} min={0.2} max={5} step={0.1} unit="s" onChange={(v) => set({ tau: v })} />
        {p.plant === "second-order" && (
          <Slider label="Damping ratio ζ" value={p.zeta} min={0.05} max={2} step={0.05} onChange={(v) => set({ zeta: v })} />
        )}
        <Slider label="Disturbance magnitude" value={p.disturbance} min={-1} max={1} step={0.05} onChange={(v) => set({ disturbance: v })} />
        <Slider label="Disturbance time" value={p.disturbanceTime} min={1} max={18} step={0.5} unit="s" onChange={(v) => set({ disturbanceTime: v })} />
        <button onClick={() => setP(defaultPidParams)}>Reset to defaults</button>
      </div>
      <div>
        <div className="card">
          <LinePlot
            title="PID step response"
            xLabel="time (s)"
            yLabel="value"
            series={[
              { name: "Setpoint", color: "var(--chart-2)", dashed: true, points: points.map((pt) => ({ x: pt.t, y: pt.sp })) },
              { name: "PV", color: "var(--chart-1)", points: points.map((pt) => ({ x: pt.t, y: pt.pv })) }
            ]}
          />
          <LinePlot
            title="Control effort"
            xLabel="time (s)"
            yLabel="u"
            height={160}
            series={[{ name: "Control effort u", color: "var(--chart-3)", points: points.map((pt) => ({ x: pt.t, y: pt.u })) }]}
          />
          <div className="metric-grid">
            <div className="metric">
              <div className="label">Overshoot</div>
              <div className="val">{round(m.overshootPct, 1)}%</div>
            </div>
            <div className="metric">
              <div className="label">Rise time</div>
              <div className="val">{m.riseTime !== null ? `${round(m.riseTime)} s` : "-"}</div>
            </div>
            <div className="metric">
              <div className="label">Settling (2%)</div>
              <div className="val">{m.settlingTime !== null ? `${round(m.settlingTime)} s` : "not settled"}</div>
            </div>
            <div className="metric">
              <div className="label">SS error</div>
              <div className="val">{round(m.steadyStateError, 3)}</div>
            </div>
          </div>
          <p className="small muted">
            Actuator saturates at ±10 with basic anti-windup. Watch the effort plot when tuning aggressively - a
            flat-lined effort means the controller is asking for more than the actuator can give.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PidLab() {
  const mod = moduleById("pid")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}
