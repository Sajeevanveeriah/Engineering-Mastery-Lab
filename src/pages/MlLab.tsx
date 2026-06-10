import { useMemo, useState } from "react";
import { ModuleShell } from "../components/ModuleShell";
import { Slider } from "../components/Slider";
import { LinePlot } from "../components/LinePlot";
import { Tabs } from "../components/Tabs";
import { moduleById } from "../data/modules";
import {
  fitLinearRegression,
  predictLinear,
  meanSquaredError,
  rSquared,
  trainTestSplit,
  knnClassify,
  confusionMatrix,
  zScoreAnomalies,
  syntheticVibration,
  remainingUsefulLife,
  type Point2
} from "../lib/simulations/ml";
import { makeRng } from "../lib/simulations/robotics";
import { round } from "../lib/metrics";

function RegressionTool() {
  const [noise, setNoise] = useState(1);
  const [seed, setSeed] = useState(1);
  const data = useMemo(() => {
    const rng = makeRng(seed);
    // Synthetic: motor temperature rise vs load current, y = 2.5x + 20 + noise
    return Array.from({ length: 40 }, (_, i) => {
      const x = i * 0.25;
      return { x, y: 2.5 * x + 20 + (rng() - 0.5) * 2 * noise * 3 };
    });
  }, [noise, seed]);
  const { train, test } = useMemo(() => trainTestSplit(data, 0.25), [data]);
  const model = useMemo(() => fitLinearRegression(train.map((d) => d.x), train.map((d) => d.y)), [train]);
  const testPred = test.map((d) => predictLinear(model, d.x));
  const mse = meanSquaredError(test.map((d) => d.y), testPred);
  const r2 = rSquared(test.map((d) => d.y), testPred);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Linear regression from scratch (least squares)</h3>
      <p className="small muted">Synthetic data: motor temperature (°C) vs load current (A). True relationship y = 2.5x + 20.</p>
      <Slider label="Noise level" value={noise} min={0} max={5} step={0.1} onChange={setNoise} />
      <p><button onClick={() => setSeed((s) => s + 1)}>Resample data</button></p>
      <div className="metric-grid">
        <div className="metric"><div className="label">Slope</div><div className="val">{round(model.slope, 3)}</div></div>
        <div className="metric"><div className="label">Intercept</div><div className="val">{round(model.intercept, 2)}</div></div>
        <div className="metric"><div className="label">Test MSE</div><div className="val">{round(mse, 3)}</div></div>
        <div className="metric"><div className="label">Test R²</div><div className="val">{round(r2, 3)}</div></div>
      </div>
      <LinePlot
        title="Data and fitted line"
        xLabel="load current (A)"
        yLabel="temp (°C)"
        series={[
          { name: "Train", color: "#9aa7bd", points: train.map((d) => ({ x: d.x, y: d.y })) },
          { name: "Test", color: "#f0a64a", points: test.map((d) => ({ x: d.x, y: d.y })) },
          { name: "Fit", color: "#4da3ff", points: [{ x: 0, y: predictLinear(model, 0) }, { x: 10, y: predictLinear(model, 10) }] }
        ]}
      />
      <p className="small muted">Train/test points are drawn as jagged polylines here for simplicity — read them as scattered samples. Metrics are computed on the held-out test set ({test.length} of {data.length} samples).</p>
    </div>
  );
}

function ClassifierTool() {
  const [k, setK] = useState(3);
  const data = useMemo(() => {
    const rng = makeRng(7);
    const pts: Point2[] = [];
    // Two clusters: healthy (low vib, low temp) vs faulty bearings (high vib, high temp)
    for (let i = 0; i < 40; i++) pts.push({ x: 2 + rng() * 2.5, y: 2 + rng() * 2.5, label: 0 });
    for (let i = 0; i < 40; i++) pts.push({ x: 4 + rng() * 2.5, y: 4 + rng() * 2.5, label: 1 });
    return pts;
  }, []);
  const { train, test } = useMemo(() => trainTestSplit(data, 0.25), [data]);
  const preds = test.map((p) => knnClassify(train, p.x, p.y, k));
  const cm = confusionMatrix(test.map((p) => p.label), preds);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>kNN classification: healthy vs faulty machine</h3>
      <p className="small muted">Features: vibration RMS (x) and bearing temperature deviation (y). Synthetic clusters with overlap.</p>
      <Slider label="k (neighbours)" value={k} min={1} max={15} step={2} onChange={setK} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Accuracy</div><div className="val">{round(cm.accuracy * 100, 1)}%</div></div>
        <div className="metric"><div className="label">Precision</div><div className="val">{round(cm.precision * 100, 1)}%</div></div>
        <div className="metric"><div className="label">Recall</div><div className="val">{round(cm.recall * 100, 1)}%</div></div>
      </div>
      <h3>Confusion matrix (test set, {test.length} samples)</h3>
      <table>
        <thead><tr><th></th><th>Predicted healthy</th><th>Predicted faulty</th></tr></thead>
        <tbody>
          <tr><th>Actually healthy</th><td>{cm.tn} (TN)</td><td>{cm.fp} (FP)</td></tr>
          <tr><th>Actually faulty</th><td>{cm.fn} (FN)</td><td>{cm.tp} (TP)</td></tr>
        </tbody>
      </table>
      <p className="small muted">In maintenance, a false negative (missed fault) usually costs far more than a false positive. Watch recall, not just accuracy.</p>
    </div>
  );
}

function AnomalyTool() {
  const [threshold, setThreshold] = useState(3);
  const anomalyIdx = [40, 95, 150];
  const signal = useMemo(() => syntheticVibration(200, 1, anomalyIdx, 4), []);
  const flagged = zScoreAnomalies(signal, threshold);
  const truePos = flagged.filter((i) => anomalyIdx.includes(i)).length;
  const falsePos = flagged.length - truePos;

  // Predictive maintenance: degrading health index from 100 toward failure at 20.
  const health = useMemo(() => Array.from({ length: 60 }, (_, i) => 100 - 0.9 * i + 2 * Math.sin(i * 0.8)), []);
  const rul = remainingUsefulLife(health, 20);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Anomaly detection & predictive maintenance</h3>
      <Slider label="Z-score threshold" value={threshold} min={1} max={6} step={0.1} onChange={setThreshold} />
      <div className="metric-grid">
        <div className="metric"><div className="label">Injected anomalies</div><div className="val">{anomalyIdx.length}</div></div>
        <div className="metric"><div className="label">Detected</div><div className="val">{truePos}</div></div>
        <div className="metric"><div className="label">False positives</div><div className="val">{falsePos}</div></div>
      </div>
      <LinePlot
        title="Synthetic vibration signal"
        xLabel="sample"
        yLabel="amplitude"
        series={[
          { name: "Vibration", color: "#4da3ff", points: signal.map((v, i) => ({ x: i, y: v })) },
          { name: "Flagged", color: "#ef5b6b", points: flagged.flatMap((i) => [{ x: i, y: -5 }, { x: i, y: 5 }, { x: i, y: -5 }]) }
        ]}
      />
      <h3>Remaining useful life (toy model)</h3>
      <LinePlot
        title="Health index degradation"
        xLabel="sample"
        yLabel="health"
        series={[
          { name: "Health index", color: "#36c08e", points: health.map((v, i) => ({ x: i, y: v })) },
          { name: "Failure threshold", color: "#ef5b6b", dashed: true, points: [{ x: 0, y: 20 }, { x: 120, y: 20 }] },
          { name: "Trend", color: "#9aa7bd", dashed: true, points: [{ x: 0, y: rul.model.intercept }, { x: 120, y: rul.model.intercept + 120 * rul.model.slope }] }
        ]}
      />
      <div className="metric-grid">
        <div className="metric"><div className="label">Degradation rate</div><div className="val">{round(rul.model.slope, 3)}/sample</div></div>
        <div className="metric"><div className="label">Estimated RUL</div><div className="val">{rul.rulSamples !== null ? `${round(rul.rulSamples, 0)} samples` : "—"}</div></div>
      </div>
      <p className="small" style={{ color: "var(--warn)" }}>
        Educational demo only: a linear trend on synthetic data. Real predictive maintenance requires validated sensors,
        domain failure models and engineering review — never deploy a toy model as a safety system.
      </p>
    </div>
  );
}

function Simulator() {
  return (
    <Tabs
      tabs={[
        { id: "reg", label: "Regression", content: <RegressionTool /> },
        { id: "cls", label: "Classification", content: <ClassifierTool /> },
        { id: "anomaly", label: "Anomaly & PdM", content: <AnomalyTool /> }
      ]}
    />
  );
}

export function MlLab() {
  const mod = moduleById("ml")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}
