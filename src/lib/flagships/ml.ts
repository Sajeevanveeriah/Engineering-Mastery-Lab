import {
  confusionMatrix,
  fitLinearRegression,
  meanSquaredError,
  predictLinear,
  type ConfusionMatrix,
  type LinRegModel
} from "../simulations/ml";

function finite(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
  return value;
}

export interface DatasetRow {
  id: string;
  features: Record<string, number>;
  target: number;
}

export interface DatasetSplit {
  train: DatasetRow[];
  validation: DatasetRow[];
  test: DatasetRow[];
}

export function deterministicDatasetSplit(
  rows: DatasetRow[],
  trainRatio = 0.6,
  validationRatio = 0.2
): DatasetSplit {
  if (rows.length < 3) {
    throw new Error("rows must contain at least three samples");
  }
  finite("trainRatio", trainRatio);
  finite("validationRatio", validationRatio);
  if (trainRatio <= 0 || validationRatio <= 0 || trainRatio + validationRatio >= 1) {
    throw new Error("train and validation ratios must be positive and leave a positive test ratio");
  }
  const ids = new Set<string>();
  rows.forEach((row, rowIndex) => {
    if (!row.id.trim() || ids.has(row.id)) {
      throw new Error("row ids must be non-empty and unique");
    }
    ids.add(row.id);
    finite(`rows[${rowIndex}].target`, row.target);
    const featureEntries = Object.entries(row.features);
    if (featureEntries.length === 0) {
      throw new Error("every row must contain at least one feature");
    }
    featureEntries.forEach(([feature, value]) => {
      if (!feature.trim()) {
        throw new Error("feature names must not be empty");
      }
      finite(`rows[${rowIndex}].features.${feature}`, value);
    });
  });

  const trainEnd = Math.max(1, Math.floor(rows.length * trainRatio));
  const validationEnd = Math.max(trainEnd + 1, Math.floor(rows.length * (trainRatio + validationRatio)));
  if (validationEnd >= rows.length) {
    throw new Error("split ratios leave no test samples at this dataset size");
  }
  return {
    train: rows.slice(0, trainEnd),
    validation: rows.slice(trainEnd, validationEnd),
    test: rows.slice(validationEnd)
  };
}

export interface RegressionBaseline {
  trainingMean: number;
  validationMse: number;
  testMse: number;
}

export function meanRegressionBaseline(split: DatasetSplit): RegressionBaseline {
  if (split.train.length === 0 || split.validation.length === 0 || split.test.length === 0) {
    throw new Error("train, validation, and test partitions must be non-empty");
  }
  const trainingMean = split.train.reduce((sum, row) => sum + row.target, 0) / split.train.length;
  return {
    trainingMean,
    validationMse: meanSquaredError(
      split.validation.map((row) => row.target),
      split.validation.map(() => trainingMean)
    ),
    testMse: meanSquaredError(
      split.test.map((row) => row.target),
      split.test.map(() => trainingMean)
    )
  };
}

export interface LinearRegressionAssessment {
  model: LinRegModel;
  validationMse: number;
  testMse: number;
  validationResiduals: number[];
  testResiduals: number[];
}

export function assessSingleFeatureRegression(split: DatasetSplit, feature: string): LinearRegressionAssessment {
  if (!feature.trim()) {
    throw new Error("feature must not be empty");
  }
  if (split.train.length === 0 || split.validation.length === 0 || split.test.length === 0) {
    throw new Error("train, validation, and test partitions must be non-empty");
  }
  const values = [...split.train, ...split.validation, ...split.test];
  if (values.some((row) => !(feature in row.features))) {
    throw new Error(`feature ${feature} is missing from at least one row`);
  }
  const model = fitLinearRegression(
    split.train.map((row) => row.features[feature]),
    split.train.map((row) => row.target)
  );
  const validationPredictions = split.validation.map((row) => predictLinear(model, row.features[feature]));
  const testPredictions = split.test.map((row) => predictLinear(model, row.features[feature]));
  const validationTargets = split.validation.map((row) => row.target);
  const testTargets = split.test.map((row) => row.target);
  return {
    model,
    validationMse: meanSquaredError(validationTargets, validationPredictions),
    testMse: meanSquaredError(testTargets, testPredictions),
    validationResiduals: validationTargets.map((target, index) => target - validationPredictions[index]),
    testResiduals: testTargets.map((target, index) => target - testPredictions[index])
  };
}

export interface DatasetWarning {
  code: "target-like-feature" | "split-overlap" | "class-imbalance";
  message: string;
}

export function leakageWarnings(split: DatasetSplit): DatasetWarning[] {
  const warnings: DatasetWarning[] = [];
  const featureNames = new Set(
    [...split.train, ...split.validation, ...split.test].flatMap((row) => Object.keys(row.features))
  );
  const suspicious = [...featureNames].filter((name) => /(target|label|future|outcome)/i.test(name));
  suspicious.forEach((name) =>
    warnings.push({
      code: "target-like-feature",
      message: `Feature "${name}" may encode the target or future information; verify provenance before modelling.`
    })
  );
  const seen = new Set<string>();
  const overlapping = new Set<string>();
  for (const row of [...split.train, ...split.validation, ...split.test]) {
    if (seen.has(row.id)) {
      overlapping.add(row.id);
    }
    seen.add(row.id);
  }
  if (overlapping.size > 0) {
    warnings.push({
      code: "split-overlap",
      message: `Sample IDs occur in more than one partition: ${[...overlapping].sort().join(", ")}.`
    });
  }
  return warnings;
}

export function classImbalanceWarning(labels: (0 | 1)[], minorityShareThreshold = 0.2): DatasetWarning | null {
  if (labels.length === 0) {
    throw new Error("labels must contain at least one value");
  }
  finite("minorityShareThreshold", minorityShareThreshold);
  if (minorityShareThreshold <= 0 || minorityShareThreshold >= 0.5) {
    throw new Error("minorityShareThreshold must be greater than zero and less than 0.5");
  }
  const positives = labels.filter((label) => label === 1).length;
  const minorityShare = Math.min(positives, labels.length - positives) / labels.length;
  if (minorityShare >= minorityShareThreshold) {
    return null;
  }
  return {
    code: "class-imbalance",
    message: `Minority class share ${minorityShare.toFixed(3)} is below the stated ${minorityShareThreshold.toFixed(
      3
    )} threshold.`
  };
}

export interface ClassificationAssessment {
  majorityClass: 0 | 1;
  majorityBaselineAccuracy: number;
  confusion: ConfusionMatrix;
}

export function assessBinaryClassification(
  trainingLabels: (0 | 1)[],
  testLabels: (0 | 1)[],
  testPredictions: (0 | 1)[]
): ClassificationAssessment {
  if (trainingLabels.length === 0 || testLabels.length === 0) {
    throw new Error("training and test labels must be non-empty");
  }
  if (testLabels.length !== testPredictions.length) {
    throw new Error("test labels and predictions must have equal lengths");
  }
  const positives = trainingLabels.filter((label) => label === 1).length;
  const majorityClass: 0 | 1 = positives > trainingLabels.length / 2 ? 1 : 0;
  const majorityBaselineAccuracy =
    testLabels.filter((label) => label === majorityClass).length / testLabels.length;
  return {
    majorityClass,
    majorityBaselineAccuracy,
    confusion: confusionMatrix(testLabels, testPredictions)
  };
}

export interface ModelCard {
  intendedUse: string;
  dataScope: string;
  metrics: string[];
  limitations: string[];
  outOfScope: string[];
}

export function educationalModelCard(
  dataScope: string,
  metrics: string[],
  additionalLimitations: string[] = []
): ModelCard {
  if (!dataScope.trim() || metrics.length === 0 || metrics.some((metric) => !metric.trim())) {
    throw new Error("model card requires a data scope and at least one metric");
  }
  return {
    intendedUse: "Local educational comparison of deterministic baseline and candidate model behaviour.",
    dataScope,
    metrics: [...metrics],
    limitations: [
      "Performance outside the stated dataset and split is unknown.",
      "Observed association does not establish causation.",
      "Synthetic or small local datasets may not represent operational conditions.",
      ...additionalLimitations
    ],
    outOfScope: [
      "Safety-critical decisions",
      "Autonomous maintenance or control actions",
      "Claims of production readiness or certification"
    ]
  };
}
