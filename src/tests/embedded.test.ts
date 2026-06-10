import { describe, it, expect } from "vitest";
import {
  runFsm,
  trafficLightFsm,
  bouncySignal,
  debounce,
  countRisingEdges,
  pollingLatency,
  interruptLatency,
  busFrame
} from "../lib/simulations/embedded";

describe("runFsm", () => {
  it("cycles through the traffic light states", () => {
    const { trace } = runFsm(trafficLightFsm, ["timer", "timer", "timer"]);
    expect(trace).toEqual(["RED", "GREEN", "YELLOW", "RED"]);
  });

  it("rejects undefined transitions", () => {
    const { trace, rejected } = runFsm(trafficLightFsm, ["reset"]);
    expect(trace).toEqual(["RED"]);
    expect(rejected).toEqual(["reset"]);
  });

  it("recovers from fault via reset", () => {
    const { trace } = runFsm(trafficLightFsm, ["timer", "fault", "reset"]);
    expect(trace[trace.length - 1]).toBe("RED");
  });
});

describe("debounce", () => {
  it("reduces bouncy edges to a single clean edge", () => {
    const raw = bouncySignal(0.2, 0.0005, 0.05, 0.13, 5, 0.002);
    const rawEdges = countRisingEdges(raw.map((p) => p.raw));
    const clean = debounce(raw, 0.015);
    const cleanEdges = countRisingEdges(clean.map((p) => p.out));
    expect(rawEdges).toBeGreaterThan(1);
    expect(cleanEdges).toBe(1);
  });

  it("misses presses shorter than the hold time", () => {
    const raw = bouncySignal(0.2, 0.0005, 0.05, 0.06, 0, 0.001); // 10 ms press
    const clean = debounce(raw, 0.05); // 50 ms hold
    expect(countRisingEdges(clean.map((p) => p.out))).toBe(0);
  });
});

describe("latency models", () => {
  it("polling worst case includes a full poll period", () => {
    expect(pollingLatency(0.005, 0.0002).worstCase).toBeCloseTo(0.0052);
  });
  it("interrupt latency is deterministic", () => {
    const r = interruptLatency(5e-6, 2e-4);
    expect(r.worstCase).toBeCloseTo(r.average);
  });
});

describe("busFrame", () => {
  it("UART frames data LSB first with start and stop bits", () => {
    const segs = busFrame("UART", 0b00000001);
    expect(segs[1].bits).toBe("0"); // start bit
    expect(segs[2].bits).toBe("10000000"); // LSB first
    expect(segs[3].bits).toBe("1"); // stop bit
  });
});
