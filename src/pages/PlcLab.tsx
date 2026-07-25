import { useEffect, useRef, useState } from "react";
import { ModuleShell } from "../components/ModuleShell";
import { LinePlot } from "../components/LinePlot";
import { Tabs, useTabPanelActive } from "../components/Tabs";
import { moduleById } from "../data/modules";
import {
  tankStep,
  defaultTankConfig,
  conveyorScan,
  initialConveyorState,
  type TankState,
  type ConveyorInputs
} from "../lib/simulations/plc";
import { round } from "../lib/metrics";

const DT = 0.1;

function TankTool() {
  const panelActive = useTabPanelActive();
  const [tank, setTank] = useState<TankState>({
    level: 30,
    fillValveOpen: false,
    drainValveOpen: false,
    highAlarm: false,
    lowAlarm: false,
    highHighTrip: false
  });
  const [trend, setTrend] = useState<{ t: number; level: number }[]>([]);
  const time = useRef(0);

  useEffect(() => {
    if (!panelActive) return;
    const id = setInterval(() => {
      setTank((s) => {
        const next = tankStep(s, defaultTankConfig, DT);
        time.current += DT;
        setTrend((tr) => [...tr.slice(-600), { t: time.current, level: next.level }]);
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [panelActive]);

  const alarms: string[] = [];
  if (tank.highHighTrip) alarms.push("LEVEL HIGH-HIGH TRIP - FILL VALVE FORCED CLOSED (LATCHED)");
  if (tank.highAlarm) alarms.push("LEVEL HIGH ALARM");
  if (tank.lowAlarm) alarms.push("LEVEL LOW ALARM");

  return (
    <div className="lab-layout">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>HMI - Tank T-101</h3>
        <div className="metric-grid">
          <div className="metric"><div className="label">Level</div><div className="val">{round(tank.level, 1)}%</div></div>
          <div className="metric"><div className="label">Fill valve</div><div className="val">{tank.fillValveOpen ? "OPEN" : "CLOSED"}</div></div>
          <div className="metric"><div className="label">Drain valve</div><div className="val">{tank.drainValveOpen ? "OPEN" : "CLOSED"}</div></div>
        </div>
        <div className="progress-bar" style={{ height: 16 }} role="progressbar" aria-valuenow={Math.round(tank.level)} aria-valuemin={0} aria-valuemax={100} aria-label="Tank level">
          <div style={{ width: `${tank.level}%`, background: tank.highHighTrip ? "var(--danger)" : tank.highAlarm ? "var(--warn)" : "var(--accent)" }} />
        </div>
        <p style={{ marginTop: "0.8rem" }}>
          <button className={tank.fillValveOpen ? "primary" : ""} disabled={tank.highHighTrip} onClick={() => setTank((s) => ({ ...s, fillValveOpen: !s.fillValveOpen }))}>
            {tank.fillValveOpen ? "Close fill valve" : "Open fill valve"}
          </button>{" "}
          <button className={tank.drainValveOpen ? "primary" : ""} onClick={() => setTank((s) => ({ ...s, drainValveOpen: !s.drainValveOpen }))}>
            {tank.drainValveOpen ? "Close drain valve" : "Open drain valve"}
          </button>{" "}
          {tank.highHighTrip && (
            <button
              className="danger"
              onClick={() => {
                if (tank.level < defaultTankConfig.highLimit) setTank((s) => ({ ...s, highHighTrip: false }));
              }}
            >
              Reset trip (level must be below {defaultTankConfig.highLimit}%)
            </button>
          )}
        </p>
        <div aria-live="polite" aria-atomic="true">
          <h3>Alarm list</h3>
          {alarms.length === 0 ? <p className="small muted">No active alarms.</p> : (
            <ul className="alarm-list">{alarms.map((a, i) => <li key={i}>{a}</li>)}</ul>
          )}
        </div>
        <p className="small muted">Limits: low {defaultTankConfig.lowLimit}%, high {defaultTankConfig.highLimit}%, high-high trip {defaultTankConfig.highHighLimit}%.</p>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Level trend</h3>
        <LinePlot
          title="Tank level trend"
          xLabel="time (s)"
          yLabel="%"
          yMin={0}
          yMax={100}
          series={[{ name: "Level", color: "var(--chart-1)", points: trend.map((p) => ({ x: p.t, y: p.level })) }]}
        />
        <h3>Structured-text style logic</h3>
        <pre className="small" style={{ background: "var(--bg-inset)", padding: "0.6rem", borderRadius: 8, overflowX: "auto" }}>{`(* every scan *)
IF Level >= HH_LIMIT THEN TripLatched := TRUE; END_IF;
IF TripLatched THEN FillValve := FALSE; END_IF;
HighAlarm := Level >= H_LIMIT;
LowAlarm  := Level <= L_LIMIT;
(* trip reset only permitted below H_LIMIT *)
IF ResetPB AND Level < H_LIMIT THEN TripLatched := FALSE; END_IF;`}</pre>
      </div>
    </div>
  );
}

function ConveyorTool() {
  const panelActive = useTabPanelActive();
  const [inputs, setInputs] = useState<ConveyorInputs>({
    startPb: false,
    stopPb: false,
    eStop: false,
    jamSensor: false,
    guardClosed: true,
    resetPb: false
  });
  const [state, setState] = useState(initialConveyorState);
  const inputsRef = useRef(inputs);

  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  useEffect(() => {
    if (!panelActive) return;
    const id = setInterval(() => {
      setState((s) => conveyorScan(s, inputsRef.current));
      // Momentary pushbuttons release themselves after the scan.
      setInputs((i) => ({ ...i, startPb: false, stopPb: false, resetPb: false }));
    }, 100);
    return () => clearInterval(id);
  }, [panelActive]);

  const toggle = (k: keyof ConveyorInputs) => setInputs((i) => ({ ...i, [k]: !i[k] }));
  const pulse = (k: keyof ConveyorInputs) => setInputs((i) => ({ ...i, [k]: true }));

  return (
    <div className="lab-layout">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>HMI - Conveyor C-201</h3>
        <div className="metric-grid">
          <div className="metric">
            <div className="label">Motor</div>
            <div className="val" style={{ color: state.running ? "var(--accent-2)" : "inherit" }}>{state.running ? "RUNNING" : "STOPPED"}</div>
          </div>
          <div className="metric">
            <div className="label">Fault latch</div>
            <div className="val" style={{ color: state.faultLatched ? "var(--danger)" : "inherit" }}>{state.faultLatched ? "LATCHED" : "HEALTHY"}</div>
          </div>
        </div>
        <p>
          <button className="primary" onClick={() => pulse("startPb")}>Start</button>{" "}
          <button onClick={() => pulse("stopPb")}>Stop</button>{" "}
          <button onClick={() => pulse("resetPb")}>Reset</button>
        </p>
        <h3>Field conditions</h3>
        <ul className="checklist">
          <li>
            <input id="estop" type="checkbox" checked={inputs.eStop} onChange={() => toggle("eStop")} />
            <label htmlFor="estop" style={{ color: "inherit" }}>Emergency stop pressed</label>
          </li>
          <li>
            <input id="jam" type="checkbox" checked={inputs.jamSensor} onChange={() => toggle("jamSensor")} />
            <label htmlFor="jam" style={{ color: "inherit" }}>Jam sensor active</label>
          </li>
          <li>
            <input id="guard" type="checkbox" checked={inputs.guardClosed} onChange={() => toggle("guardClosed")} />
            <label htmlFor="guard" style={{ color: "inherit" }}>Guard closed</label>
          </li>
        </ul>
        <div aria-live="polite" aria-atomic="true">
          <h3>Alarm list</h3>
          {state.alarms.length === 0 ? <p className="small muted">No active alarms.</p> : (
            <ul className="alarm-list">{state.alarms.map((a, i) => <li key={i}>{a}</li>)}</ul>
          )}
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ladder-style logic</h3>
        <pre className="small" style={{ background: "var(--bg-inset)", padding: "0.6rem", borderRadius: 8, overflowX: "auto" }}>{`|--[ E-Stop ]--------------------------( L ) Fault   |
|--[ Jam ]-----------------------------( L ) Fault   |
|--[ Reset ]--[/E-Stop]--[/Jam]--------( U ) Fault   |
|                                                    |
|--+--[ Start ]--+--[/Stop]--[/Fault]--[ Guard ]--   |
|  |             |                          ( ) Motor|
|  +--[ Motor ]--+   (seal-in)                       |
( L )/( U ) = latch / unlatch coil`}</pre>
        <h3>Challenge mode hints</h3>
        <ul className="small">
          <li>Trigger the jam while running, then try Start before clearing it - the interlock must win.</li>
          <li>Open the guard while running and observe the difference between a stop condition and a latched fault.</li>
          <li>Press E-stop, release it, and confirm a deliberate Reset is still required.</li>
        </ul>
        <p className="small muted">Simplified educational model - real safety circuits use hardwired, certified components, not PLC logic alone.</p>
      </div>
    </div>
  );
}

function Simulator() {
  return (
    <Tabs
      ariaLabel="PLC and SCADA simulators"
      tabs={[
        { id: "tank", label: "Tank process", content: <TankTool /> },
        { id: "conveyor", label: "Conveyor & interlocks", content: <ConveyorTool /> }
      ]}
    />
  );
}

export function PlcLab() {
  const mod = moduleById("plc")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}
