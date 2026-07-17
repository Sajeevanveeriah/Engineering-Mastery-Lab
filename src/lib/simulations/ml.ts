// Educational ML implementations from scratch. Synthetic data only -
// these demos are for learning and are NOT production safety systems.

export interface LinRegModel {
  slope: number;
  intercept: number;
}

/** Ordinary least squares fit for y = slope*x + intercept. */
export function fitLinearRegression(xs: number[], ys: number[]): LinRegModel {
  const n = xs.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: my - slope * mx };
}

export function predictLinear(model: LinRegModel, x: number): number {
  return model.slope * x + model.intercept;
}

export function meanSquaredError(yTrue: number[], yPred: number[]): number {
  if (yTrue.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < yTrue.length; i++) s += (yTrue[i] - yPred[i]) ** 2;
  return s / yTrue.length;
}

export function rSquared(yTrue: number[], yPred: number[]): number {
  const my = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < yTrue.length; i++) {
    ssRes += (yTrue[i] - yPred[i]) ** 2;
    ssTot += (yTrue[i] - my) ** 2;
  }
  return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

/** Deterministic train/test split: every k-th sample goes to the test set. */
export function trainTestSplit<T>(data: T[], testRatio: number): { train: T[]; test: T[] } {
  const k = testRatio <= 0 ? Infinity : Math.max(2, Math.round(1 / testRatio));
  const train: T[] = [];
  const test: T[] = [];
  data.forEach((d, i) => ((i + 1) % k === 0 ? test : train).push(d));
  return { train, test };
}

export interface Point2 {
  x: number;
  y: number;
  label: 0 | 1;
}

/** k-nearest-neighbour classifier (k odd recommended). */
export function knnClassify(train: Point2[], x: number, y: number, k: number): 0 | 1 {
  const sorted = [...train].sort(
    (a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2)
  );
  const votes = sorted.slice(0, k).reduce((acc, p) => acc + p.label, 0);
  return votes * 2 > k ? 1 : 0;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  accuracy: number;
  precision: number;
  recall: number;
}

export function confusionMatrix(yTrue: (0 | 1)[], yPred: (0 | 1)[]): ConfusionMatrix {
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1 && yPred[i] === 1) tp++;
    else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
    else if (yTrue[i] === 0 && yPred[i] === 0) tn++;
    else fn++;
  }
  const total = tp + fp + tn + fn;
  return {
    tp,
    fp,
    tn,
    fn,
    accuracy: total === 0 ? 0 : (tp + tn) / total,
    precision: tp + fp === 0 ? 0 : tp / (tp + fp),
    recall: tp + fn === 0 ? 0 : tp / (tp + fn)
  };
}

/** Z-score anomaly detection: returns indices where |z| > threshold. */
export function zScoreAnomalies(values: number[], threshold: number): number[] {
  const n = values.length;
  if (n === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  if (std === 0) return [];
  const out: number[] = [];
  values.forEach((v, i) => {
    if (Math.abs((v - mean) / std) > threshold) out.push(i);
  });
  return out;
}

/** Synthetic machine vibration signal with injected anomaly spikes (deterministic). */
export function syntheticVibration(
  n: number,
  baseAmplitude: number,
  anomalyIndices: number[],
  anomalyScale: number
): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    // Deterministic pseudo-noise from sines keeps tests reproducible.
    const noise = 0.3 * Math.sin(i * 1.7) + 0.2 * Math.sin(i * 0.31 + 1);
    let v = baseAmplitude * Math.sin(i * 0.5) + noise;
    if (anomalyIndices.includes(i)) v += anomalyScale * baseAmplitude;
    out.push(v);
  }
  return out;
}

/**
 * Predictive-maintenance toy model: linear degradation trend fit and remaining
 * useful life estimate against a failure threshold.
 */
export function remainingUsefulLife(
  health: number[],
  failureThreshold: number
): { model: LinRegModel; rulSamples: number | null } {
  const xs = health.map((_, i) => i);
  const model = fitLinearRegression(xs, health);
  if (model.slope >= 0) return { model, rulSamples: null }; // not degrading
  const tFail = (failureThreshold - model.intercept) / model.slope;
  const rul = tFail - (health.length - 1);
  return { model, rulSamples: rul > 0 ? rul : 0 };
}
