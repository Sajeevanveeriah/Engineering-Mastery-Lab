// Embedded systems teaching simulations: FSM, debounce, interrupt vs polling.

export interface FsmTransition {
  from: string;
  event: string;
  to: string;
}

export interface FsmDefinition {
  states: string[];
  initial: string;
  transitions: FsmTransition[];
}

/** Run a list of events through an FSM, returning the visited state trace. */
export function runFsm(def: FsmDefinition, events: string[]): { trace: string[]; rejected: string[] } {
  let state = def.initial;
  const trace = [state];
  const rejected: string[] = [];
  for (const ev of events) {
    const t = def.transitions.find((tr) => tr.from === state && tr.event === ev);
    if (t) {
      state = t.to;
      trace.push(state);
    } else {
      rejected.push(ev);
    }
  }
  return { trace, rejected };
}

/** Traffic-light style FSM used by the lab UI. */
export const trafficLightFsm: FsmDefinition = {
  states: ["RED", "GREEN", "YELLOW", "FAULT"],
  initial: "RED",
  transitions: [
    { from: "RED", event: "timer", to: "GREEN" },
    { from: "GREEN", event: "timer", to: "YELLOW" },
    { from: "YELLOW", event: "timer", to: "RED" },
    { from: "RED", event: "fault", to: "FAULT" },
    { from: "GREEN", event: "fault", to: "FAULT" },
    { from: "YELLOW", event: "fault", to: "FAULT" },
    { from: "FAULT", event: "reset", to: "RED" }
  ]
};

/**
 * Generate a noisy switch-press signal: nominal press from tPress to tRelease,
 * with `bounces` contact bounces of `bounceWidth` after each edge.
 */
export function bouncySignal(
  duration: number,
  dt: number,
  tPress: number,
  tRelease: number,
  bounces: number,
  bounceWidth: number
): { t: number; raw: number }[] {
  const pts: { t: number; raw: number }[] = [];
  const n = Math.round(duration / dt);
  for (let i = 0; i <= n; i++) {
    const t = i * dt;
    let v = t >= tPress && t < tRelease ? 1 : 0;
    // Deterministic bounce pattern after each edge so tests are stable.
    for (let b = 0; b < bounces; b++) {
      const pressBounce = tPress + (b + 1) * bounceWidth;
      const relBounce = tRelease + (b + 1) * bounceWidth;
      if (t >= pressBounce - bounceWidth / 2 && t < pressBounce) v = b % 2 === 0 ? 0 : 1;
      if (t >= relBounce - bounceWidth / 2 && t < relBounce) v = b % 2 === 0 ? 1 : 0;
    }
    pts.push({ t, raw: v });
  }
  return pts;
}

/** Debounce a 0/1 signal: output changes only after the input is stable for holdTime. */
export function debounce(signal: { t: number; raw: number }[], holdTime: number): { t: number; out: number }[] {
  const out: { t: number; out: number }[] = [];
  let stableValue = signal.length > 0 ? signal[0].raw : 0;
  let candidate = stableValue;
  let candidateSince = signal.length > 0 ? signal[0].t : 0;
  for (const s of signal) {
    if (s.raw !== candidate) {
      candidate = s.raw;
      candidateSince = s.t;
    }
    if (candidate !== stableValue && s.t - candidateSince >= holdTime) {
      stableValue = candidate;
    }
    out.push({ t: s.t, out: stableValue });
  }
  return out;
}

/** Count rising edges in a 0/1 signal — used to show why debouncing matters. */
export function countRisingEdges(values: number[]): number {
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] === 1 && values[i - 1] === 0) count++;
  }
  return count;
}

export interface LatencyResult {
  /** Worst-case response latency. */
  worstCase: number;
  /** Average response latency. */
  average: number;
}

/** Polling latency: event waits up to one full poll period plus handler time. */
export function pollingLatency(pollPeriod: number, handlerTime: number): LatencyResult {
  return { worstCase: pollPeriod + handlerTime, average: pollPeriod / 2 + handlerTime };
}

/** Interrupt latency: fixed entry overhead plus handler time. */
export function interruptLatency(isrOverhead: number, handlerTime: number): LatencyResult {
  return { worstCase: isrOverhead + handlerTime, average: isrOverhead + handlerTime };
}

export type BusKind = "UART" | "SPI" | "I2C";

export interface BusSegment {
  label: string;
  bits: string;
}

/** Conceptual frame structure for serial buses, used to render timing diagrams. */
export function busFrame(kind: BusKind, dataByte: number): BusSegment[] {
  const bits = dataByte.toString(2).padStart(8, "0");
  switch (kind) {
    case "UART":
      return [
        { label: "idle", bits: "1" },
        { label: "start", bits: "0" },
        { label: "data (LSB first)", bits: bits.split("").reverse().join("") },
        { label: "stop", bits: "1" }
      ];
    case "SPI":
      return [
        { label: "CS low", bits: "0" },
        { label: "data (MSB first, per SCLK)", bits },
        { label: "CS high", bits: "1" }
      ];
    case "I2C":
      return [
        { label: "start (SDA falls, SCL high)", bits: "0" },
        { label: "address + R/W", bits: "1010000" + "0" },
        { label: "ACK", bits: "0" },
        { label: "data", bits },
        { label: "ACK", bits: "0" },
        { label: "stop (SDA rises, SCL high)", bits: "1" }
      ];
  }
}
