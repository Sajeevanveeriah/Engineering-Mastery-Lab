import { useMemo, useState } from "react";
import { Equation } from "../components/AcademyMath";
import { ModuleShell } from "../components/ModuleShell";
import { Slider } from "../components/Slider";
import { LinePlot } from "../components/LinePlot";
import { Tabs } from "../components/Tabs";
import { labMathExpressions } from "../data/mathExpressions";
import { moduleById } from "../data/modules";
import {
  ohmsLaw,
  rcCharge,
  rcCutoffHz,
  rcLowPassGain,
  rlcStepResponse,
  voltageDivider,
  adcQuantise,
  sineWave
} from "../lib/simulations/electrical";
import { round } from "../lib/metrics";

function OhmTool() {
  const [v, setV] = useState(5);
  const [r, setR] = useState(1000);
  const res = ohmsLaw(v, r);
  return (
    <div className="card">
      <Equation
        expression={labMathExpressions["electrical-ohm"]}
        fallbackText={labMathExpressions["electrical-ohm"].plainText}
        label="Ohm's law and resistive power"
      />
      <Slider label="Voltage" value={v} min={0.5} max={48} step={0.5} unit="V" onChange={setV} />
      <Slider label="Resistance" value={r} min={10} max={100000} step={10} unit="Ω" onChange={setR} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Current</div><div className="val">{round(res.current * 1000, 3)} mA</div></div>
        <div className="metric"><div className="label">Power</div><div className="val">{round(res.power * 1000, 2)} mW</div></div>
      </div>
    </div>
  );
}

function RcChargeTool() {
  const [vs, setVs] = useState(5);
  const [r, setR] = useState(10000);
  const [cUf, setCUf] = useState(100);
  const c = cUf * 1e-6;
  const tau = r * c;
  const pts = useMemo(() => rcCharge(vs, r, c, tau * 5), [vs, r, c, tau]);
  return (
    <div className="card">
      <Equation
        expression={labMathExpressions["electrical-rc-charge"]}
        fallbackText={labMathExpressions["electrical-rc-charge"].plainText}
        label="RC charging model"
      />
      <Slider label="Supply voltage" value={vs} min={1} max={24} step={0.5} unit="V" onChange={setVs} />
      <Slider label="Resistance" value={r} min={100} max={100000} step={100} unit="Ω" onChange={setR} />
      <Slider label="Capacitance" value={cUf} min={1} max={1000} step={1} unit="µF" onChange={setCUf} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Time constant</div><div className="val">{round(tau, 3)} s</div></div>
        <div className="metric"><div className="label">Voltage after one time constant</div><div className="val">{round(vs * 0.632, 2)} V</div></div>
      </div>
      <LinePlot title="RC charging" xLabel="time (s)" yLabel="voltage (V)" series={[{ name: "Capacitor voltage", color: "var(--chart-1)", points: pts.map((p) => ({ x: p.t, y: p.v })) }]} />
    </div>
  );
}

function RcFilterTool() {
  const [r, setR] = useState(1600);
  const [cNf, setCNf] = useState(100);
  const [f, setF] = useState(1000);
  const c = cNf * 1e-9;
  const fc = rcCutoffHz(r, c);
  const gain = rcLowPassGain(r, c, f);
  const gain10 = rcLowPassGain(r, c, 10);
  const wave = useMemo(() => sineWave(1, f, 3 / f), [f]);
  const filtered = wave.map((p) => ({ ...p, v: p.v * gain }));
  return (
    <div className="card">
      <Equation
        expression={labMathExpressions["electrical-rc-filter"]}
        fallbackText={labMathExpressions["electrical-rc-filter"].plainText}
        label="RC low-pass filter model"
      />
      <Slider label="Resistance" value={r} min={100} max={100000} step={100} unit="Ω" onChange={setR} />
      <Slider label="Capacitance" value={cNf} min={1} max={10000} step={1} unit="nF" onChange={setCNf} />
      <Slider label="Test frequency" value={f} min={1} max={20000} step={1} unit="Hz" onChange={setF} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Cutoff frequency</div><div className="val">{round(fc, 1)} Hz</div></div>
        <div className="metric"><div className="label">Gain at test frequency</div><div className="val">{round(gain * 100, 1)}%</div></div>
        <div className="metric"><div className="label">Gain at 10 Hz</div><div className="val">{round(gain10 * 100, 1)}%</div></div>
      </div>
      <LinePlot
        title="Filter input vs output"
        xLabel="time (s)"
        yLabel="voltage (V)"
        series={[
          { name: "Input", color: "var(--chart-2)", dashed: true, points: wave.map((p) => ({ x: p.t, y: p.v })) },
          { name: "Output", color: "var(--chart-3)", points: filtered.map((p) => ({ x: p.t, y: p.v })) }
        ]}
      />
    </div>
  );
}

function RlcTool() {
  const [r, setR] = useState(20);
  const [lMh, setLMh] = useState(10);
  const [cUf, setCUf] = useState(10);
  const l = lMh * 1e-3;
  const c = cUf * 1e-6;
  const res = useMemo(() => rlcStepResponse(5, r, l, c, 0.02), [r, l, c]);
  return (
    <div className="card">
      <Equation
        expression={labMathExpressions["electrical-rlc"]}
        fallbackText={labMathExpressions["electrical-rlc"].plainText}
        label="Series RLC frequency and damping model"
      />
      <Slider label="Resistance" value={r} min={0.5} max={500} step={0.5} unit="Ω" onChange={setR} />
      <Slider label="Inductance" value={lMh} min={1} max={100} step={1} unit="mH" onChange={setLMh} />
      <Slider label="Capacitance" value={cUf} min={0.1} max={100} step={0.1} unit="µF" onChange={setCUf} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Undamped angular frequency</div><div className="val">{round(res.omega0, 0)} rad/s</div></div>
        <div className="metric"><div className="label">Damping ratio</div><div className="val">{round(res.zeta, 3)}</div></div>
        <div className="metric"><div className="label">Regime</div><div className="val" style={{ fontSize: "0.9rem" }}>{res.regime}</div></div>
      </div>
      <LinePlot title="RLC capacitor-voltage step response" xLabel="time (s)" yLabel="voltage (V)" series={[{ name: "Capacitor voltage", color: "var(--chart-4)", points: res.points.map((p) => ({ x: p.t, y: p.v })) }]} />
    </div>
  );
}

function SensorTool() {
  const [vin, setVin] = useState(5);
  const [r1, setR1] = useState(10000);
  const [r2, setR2] = useState(10000);
  const [bits, setBits] = useState(10);
  const vout = voltageDivider(vin, r1, r2);
  const adc = adcQuantise(vout, 3.3, bits);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Sensor interface: divider to ADC</h3>
      <Equation
        expression={labMathExpressions["electrical-divider-adc"]}
        fallbackText={labMathExpressions["electrical-divider-adc"].plainText}
        label="Voltage divider and ADC resolution"
      />
      <Slider label="Sensor supply voltage" value={vin} min={1} max={24} step={0.1} unit="V" onChange={setVin} />
      <Slider label="Top resistance" value={r1} min={100} max={100000} step={100} unit="Ω" onChange={setR1} />
      <Slider label="Bottom resistance" value={r2} min={100} max={100000} step={100} unit="Ω" onChange={setR2} />
      <Slider label="ADC resolution" value={bits} min={8} max={16} step={1} unit="bits" onChange={setBits} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Divider out</div><div className="val">{round(vout, 3)} V</div></div>
        <div className="metric"><div className="label">ADC code</div><div className="val">{adc.code}</div></div>
        <div className="metric"><div className="label">LSB size</div><div className="val">{round(adc.lsb * 1000, 3)} mV</div></div>
        <div className="metric"><div className="label">Quantised</div><div className="val">{round(adc.quantised, 4)} V</div></div>
      </div>
      <p className="small muted">
        ADC reference is 3.3 V. Outputs above Vref clip - exactly the mistake the divider exists to prevent. Combine
        with the RC filter tab for anti-noise filtering before the ADC.
      </p>
    </div>
  );
}

function Simulator() {
  return (
    <Tabs
      tabs={[
        { id: "ohm", label: "Ohm's law", content: <OhmTool /> },
        { id: "rc", label: "RC charging", content: <RcChargeTool /> },
        { id: "filter", label: "RC filter", content: <RcFilterTool /> },
        { id: "rlc", label: "RLC response", content: <RlcTool /> },
        { id: "sensor", label: "Sensor + ADC", content: <SensorTool /> }
      ]}
    />
  );
}

export function ElectricalLab() {
  const mod = moduleById("electrical")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}
