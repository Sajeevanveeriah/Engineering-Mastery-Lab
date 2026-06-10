// Electrical and electronics calculation engine: pure functions only.

export interface OhmResult {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
}

/** Solve Ohm's law given V and R. */
export function ohmsLaw(voltage: number, resistance: number): OhmResult {
  const current = resistance === 0 ? 0 : voltage / resistance;
  return { voltage, current, resistance, power: voltage * current };
}

/** RC charging curve: v(t) = Vs(1 - e^(-t/RC)). Returns sampled points. */
export function rcCharge(
  vs: number,
  r: number,
  c: number,
  duration: number,
  samples = 200
): { t: number; v: number }[] {
  const tau = r * c;
  const pts: { t: number; v: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (duration * i) / samples;
    pts.push({ t, v: vs * (1 - Math.exp(-t / tau)) });
  }
  return pts;
}

/** First-order RC low-pass filter magnitude gain at frequency f (Hz). */
export function rcLowPassGain(r: number, c: number, f: number): number {
  const fc = 1 / (2 * Math.PI * r * c);
  return 1 / Math.sqrt(1 + (f / fc) ** 2);
}

export function rcCutoffHz(r: number, c: number): number {
  return 1 / (2 * Math.PI * r * c);
}

/** Voltage divider output. */
export function voltageDivider(vin: number, r1: number, r2: number): number {
  const total = r1 + r2;
  return total === 0 ? 0 : (vin * r2) / total;
}

/** Quantise an analog voltage with an N-bit ADC over [0, vref]. */
export function adcQuantise(v: number, vref: number, bits: number): { code: number; quantised: number; lsb: number } {
  const levels = 2 ** bits;
  const lsb = vref / levels;
  const clamped = Math.min(Math.max(v, 0), vref);
  const code = Math.min(levels - 1, Math.floor(clamped / lsb));
  return { code, quantised: code * lsb, lsb };
}

export interface RlcResult {
  /** Undamped natural frequency in rad/s. */
  omega0: number;
  /** Damping ratio. */
  zeta: number;
  regime: "underdamped" | "critically-damped" | "overdamped";
  points: { t: number; v: number }[];
}

/** Series RLC step response of capacitor voltage (analytic solution). */
export function rlcStepResponse(
  vs: number,
  r: number,
  l: number,
  c: number,
  duration: number,
  samples = 300
): RlcResult {
  const omega0 = 1 / Math.sqrt(l * c);
  const alpha = r / (2 * l);
  const zeta = alpha / omega0;
  const regime: RlcResult["regime"] =
    Math.abs(zeta - 1) < 1e-9 ? "critically-damped" : zeta < 1 ? "underdamped" : "overdamped";

  const points: { t: number; v: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (duration * i) / samples;
    let v: number;
    if (regime === "underdamped") {
      const wd = omega0 * Math.sqrt(1 - zeta * zeta);
      v = vs * (1 - Math.exp(-alpha * t) * (Math.cos(wd * t) + (alpha / wd) * Math.sin(wd * t)));
    } else if (regime === "critically-damped") {
      v = vs * (1 - Math.exp(-alpha * t) * (1 + alpha * t));
    } else {
      const s1 = -alpha + Math.sqrt(alpha * alpha - omega0 * omega0);
      const s2 = -alpha - Math.sqrt(alpha * alpha - omega0 * omega0);
      v = vs * (1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1));
    }
    points.push({ t, v });
  }
  return { omega0, zeta, regime, points };
}

/** Sine wave sampler for waveform displays. */
export function sineWave(amplitude: number, freqHz: number, duration: number, samples = 300): { t: number; v: number }[] {
  const pts: { t: number; v: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (duration * i) / samples;
    pts.push({ t, v: amplitude * Math.sin(2 * Math.PI * freqHz * t) });
  }
  return pts;
}
