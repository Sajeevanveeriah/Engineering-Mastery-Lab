import { useMemo, useState } from "react";
import { ModuleShell } from "../components/ModuleShell";
import { Slider } from "../components/Slider";
import { LinePlot } from "../components/LinePlot";
import { Tabs } from "../components/Tabs";
import { moduleById } from "../data/modules";
import { gearRatio, powerFromTorque, springMassDamper, naturalFrequencyHz } from "../lib/simulations/mechanical";
import { round } from "../lib/metrics";

function GearTool() {
  const [teethIn, setTeethIn] = useState(15);
  const [teethOut, setTeethOut] = useState(60);
  const [speed, setSpeed] = useState(3000);
  const [torque, setTorque] = useState(0.5);
  const g = gearRatio(teethIn, teethOut, speed, torque);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Gear ratio & power</h3>
      <Slider label="Input gear teeth" value={teethIn} min={8} max={120} step={1} onChange={setTeethIn} />
      <Slider label="Output gear teeth" value={teethOut} min={8} max={240} step={1} onChange={setTeethOut} />
      <Slider label="Input speed" value={speed} min={100} max={10000} step={50} unit="rpm" onChange={setSpeed} />
      <Slider label="Input torque" value={torque} min={0.05} max={10} step={0.05} unit="Nm" onChange={setTorque} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Ratio</div><div className="val">{round(g.ratio, 2)}:1</div></div>
        <div className="metric"><div className="label">Output speed</div><div className="val">{round(g.outputSpeed, 0)} rpm</div></div>
        <div className="metric"><div className="label">Output torque</div><div className="val">{round(g.outputTorque, 2)} Nm</div></div>
        <div className="metric"><div className="label">Power in</div><div className="val">{round(powerFromTorque(torque, speed), 1)} W</div></div>
        <div className="metric"><div className="label">Power out</div><div className="val">{round(powerFromTorque(g.outputTorque, g.outputSpeed), 1)} W</div></div>
      </div>
      <p className="small muted">Ideal (lossless) mesh: power in equals power out. Real gearboxes lose 1-10% per stage to friction.</p>
    </div>
  );
}

function SmdTool() {
  const [mass, setMass] = useState(2);
  const [k, setK] = useState(200);
  const [c, setC] = useState(8);
  const res = useMemo(
    () => springMassDamper({ mass, stiffness: k, damping: c, x0: 0.1, v0: 0, duration: 4, dt: 0.002 }),
    [mass, k, c]
  );
  const cCrit = 2 * Math.sqrt(k * mass);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Spring-mass-damper free response</h3>
      <Slider label="Mass" value={mass} min={0.1} max={20} step={0.1} unit="kg" onChange={setMass} />
      <Slider label="Stiffness k" value={k} min={10} max={2000} step={10} unit="N/m" onChange={setK} />
      <Slider label="Damping c" value={c} min={0} max={100} step={0.5} unit="Ns/m" onChange={setC} />
      <div className="metric-grid">
        <div className="metric"><div className="label">fn</div><div className="val">{round(res.naturalFreqHz, 2)} Hz</div></div>
        <div className="metric"><div className="label">ζ</div><div className="val">{round(res.dampingRatio, 3)}</div></div>
        <div className="metric"><div className="label">Critical c</div><div className="val">{round(cCrit, 1)} Ns/m</div></div>
      </div>
      <LinePlot
        title="Displacement response"
        xLabel="time (s)"
        yLabel="x (m)"
        series={[{ name: "x(t)", color: "var(--chart-1)", points: res.points.map((p) => ({ x: p.t, y: p.x })) }]}
      />
    </div>
  );
}

function VibrationTool() {
  const [mass, setMass] = useState(50);
  const [k, setK] = useState(200000);
  const fn = naturalFrequencyHz(mass, k);
  const excitation = 10;
  const margin = Math.abs(fn - excitation) / excitation;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Vibration frequency explorer</h3>
      <p className="small muted">A machine mount excited at 10 Hz (e.g. 600 rpm imbalance). Keep fn well away from the excitation.</p>
      <Slider label="Mounted mass" value={mass} min={5} max={500} step={5} unit="kg" onChange={setMass} />
      <Slider label="Mount stiffness" value={k} min={10000} max={2000000} step={10000} unit="N/m" onChange={setK} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Natural freq fn</div><div className="val">{round(fn, 2)} Hz</div></div>
        <div className="metric"><div className="label">Excitation</div><div className="val">{excitation} Hz</div></div>
        <div className="metric">
          <div className="label">Separation</div>
          <div className="val" style={{ color: margin < 0.3 ? "var(--danger)" : "var(--accent-2)" }}>{round(margin * 100, 0)}%</div>
        </div>
      </div>
      {margin < 0.3 ? (
        <p className="small" style={{ color: "var(--danger)" }}>Resonance risk: fn within 30% of the excitation frequency. Change mass or stiffness.</p>
      ) : (
        <p className="small" style={{ color: "var(--accent-2)" }}>Acceptable separation for this exercise (≥ 30%).</p>
      )}
    </div>
  );
}

function Simulator() {
  return (
    <Tabs
      tabs={[
        { id: "gear", label: "Gears & power", content: <GearTool /> },
        { id: "smd", label: "Spring-mass-damper", content: <SmdTool /> },
        { id: "vib", label: "Vibration explorer", content: <VibrationTool /> }
      ]}
    />
  );
}

export function MechanicalLab() {
  const mod = moduleById("mechanical")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}
