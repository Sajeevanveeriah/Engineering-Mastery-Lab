import { useMemo, useState } from "react";
import { ModuleShell } from "../components/ModuleShell";
import { Slider } from "../components/Slider";
import { LinePlot } from "../components/LinePlot";
import { Tabs } from "../components/Tabs";
import { moduleById } from "../data/modules";
import {
  trafficLightFsm,
  runFsm,
  bouncySignal,
  debounce,
  countRisingEdges,
  pollingLatency,
  interruptLatency,
  busFrame,
  type BusKind
} from "../lib/simulations/embedded";
import { round } from "../lib/metrics";

function FsmTool() {
  const [events, setEvents] = useState<string[]>([]);
  const { trace, rejected } = useMemo(() => runFsm(trafficLightFsm, events), [events]);
  const current = trace[trace.length - 1];
  const colors: Record<string, string> = { RED: "#ef5b6b", GREEN: "#36c08e", YELLOW: "#f0a64a", FAULT: "#9aa7bd" };
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Traffic-light FSM</h3>
      <p>
        Current state:{" "}
        <strong style={{ color: colors[current] }}>{current}</strong>
      </p>
      <p>
        {["timer", "fault", "reset"].map((ev) => (
          <button key={ev} style={{ marginRight: "0.4rem" }} onClick={() => setEvents((e) => [...e, ev])}>
            Send "{ev}"
          </button>
        ))}
        <button onClick={() => setEvents([])}>Reset trace</button>
      </p>
      <p className="small">
        <strong>State trace:</strong> {trace.join(" → ")}
      </p>
      {rejected.length > 0 && (
        <p className="small" style={{ color: "var(--warn)" }}>
          Rejected events (no transition defined): {rejected.join(", ")} — in firmware these would be silently ignored
          or logged.
        </p>
      )}
      <table>
        <thead><tr><th>From</th><th>Event</th><th>To</th></tr></thead>
        <tbody>
          {trafficLightFsm.transitions.map((t, i) => (
            <tr key={i}><td>{t.from}</td><td>{t.event}</td><td>{t.to}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DebounceTool() {
  const [bounces, setBounces] = useState(4);
  const [bounceMs, setBounceMs] = useState(2);
  const [holdMs, setHoldMs] = useState(10);
  const dt = 0.0005;
  const raw = useMemo(
    () => bouncySignal(0.2, dt, 0.05, 0.13, bounces, bounceMs / 1000),
    [bounces, bounceMs]
  );
  const clean = useMemo(() => debounce(raw, holdMs / 1000), [raw, holdMs]);
  const rawEdges = countRisingEdges(raw.map((p) => p.raw));
  const cleanEdges = countRisingEdges(clean.map((p) => p.out));
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Button debouncing</h3>
      <Slider label="Contact bounces per edge" value={bounces} min={0} max={10} step={1} onChange={setBounces} />
      <Slider label="Bounce width" value={bounceMs} min={0.5} max={10} step={0.5} unit="ms" onChange={setBounceMs} />
      <Slider label="Debounce hold time" value={holdMs} min={1} max={60} step={1} unit="ms" onChange={setHoldMs} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Raw rising edges</div><div className="val">{rawEdges}</div></div>
        <div className="metric"><div className="label">Debounced edges</div><div className="val">{cleanEdges}</div></div>
        <div className="metric"><div className="label">Target</div><div className="val">1</div></div>
      </div>
      <LinePlot
        title="Raw vs debounced signal"
        xLabel="time (s)"
        yMin={-0.1}
        yMax={1.4}
        series={[
          { name: "Raw", color: "#9aa7bd", points: raw.map((p) => ({ x: p.t, y: p.raw + 0.25 })) },
          { name: "Debounced", color: "#4da3ff", points: clean.map((p) => ({ x: p.t, y: p.out })) }
        ]}
      />
      <p className="small muted">Raw trace offset +0.25 for visibility. One press should yield exactly one debounced edge.</p>
    </div>
  );
}

function LatencyTool() {
  const [pollMs, setPollMs] = useState(5);
  const [handlerUs, setHandlerUs] = useState(200);
  const [isrUs, setIsrUs] = useState(5);
  const poll = pollingLatency(pollMs / 1000, handlerUs / 1e6);
  const intr = interruptLatency(isrUs / 1e6, handlerUs / 1e6);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Interrupt vs polling latency</h3>
      <Slider label="Poll period" value={pollMs} min={0.1} max={50} step={0.1} unit="ms" onChange={setPollMs} />
      <Slider label="Handler execution time" value={handlerUs} min={10} max={5000} step={10} unit="µs" onChange={setHandlerUs} />
      <Slider label="ISR entry overhead" value={isrUs} min={1} max={50} step={1} unit="µs" onChange={setIsrUs} />
      <table>
        <thead><tr><th>Approach</th><th>Worst-case latency</th><th>Average latency</th></tr></thead>
        <tbody>
          <tr><td>Polling</td><td>{round(poll.worstCase * 1000, 3)} ms</td><td>{round(poll.average * 1000, 3)} ms</td></tr>
          <tr><td>Interrupt</td><td>{round(intr.worstCase * 1000, 3)} ms</td><td>{round(intr.average * 1000, 3)} ms</td></tr>
        </tbody>
      </table>
      <p className="small muted">
        Polling worst case = one full poll period + handler time (event arrives just after a check). Interrupts trade
        deterministic latency for concurrency complexity: shared data, re-entrancy and priority management.
      </p>
    </div>
  );
}

function BusTool() {
  const [kind, setKind] = useState<BusKind>("UART");
  const [byte, setByte] = useState(0x5a);
  const segments = busFrame(kind, byte);
  const bitstream = segments.flatMap((s) => s.bits.split("").map((b) => ({ seg: s.label, bit: Number(b) })));
  const pts = bitstream.flatMap((b, i) => [
    { x: i, y: b.bit },
    { x: i + 1, y: b.bit }
  ]);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Serial bus frame: {kind}</h3>
      <p>
        {(["UART", "SPI", "I2C"] as BusKind[]).map((k) => (
          <button key={k} style={{ marginRight: "0.4rem" }} onClick={() => setKind(k)} aria-pressed={kind === k}>
            {k}
          </button>
        ))}
      </p>
      <Slider label="Data byte" value={byte} min={0} max={255} step={1} onChange={setByte} />
      <p className="small muted">Byte = 0x{byte.toString(16).padStart(2, "0").toUpperCase()} = 0b{byte.toString(2).padStart(8, "0")}</p>
      <LinePlot
        title={`${kind} conceptual frame`}
        xLabel="bit slots"
        yMin={-0.2}
        yMax={1.4}
        height={140}
        series={[{ name: "line level", color: "#4da3ff", points: pts }]}
      />
      <table>
        <thead><tr><th>Segment</th><th>Bits</th></tr></thead>
        <tbody>
          {segments.map((s, i) => (
            <tr key={i}><td>{s.label}</td><td style={{ fontFamily: "monospace" }}>{s.bits}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">Conceptual diagrams: clock lines, setup/hold timing and multi-byte transactions are simplified.</p>
    </div>
  );
}

function Simulator() {
  return (
    <Tabs
      tabs={[
        { id: "fsm", label: "State machine", content: <FsmTool /> },
        { id: "debounce", label: "Debounce", content: <DebounceTool /> },
        { id: "latency", label: "Interrupt vs polling", content: <LatencyTool /> },
        { id: "bus", label: "UART / SPI / I2C", content: <BusTool /> }
      ]}
    />
  );
}

export function EmbeddedLab() {
  const mod = moduleById("embedded")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}
