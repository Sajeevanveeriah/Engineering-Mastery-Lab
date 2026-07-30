export const EXPECTED_WORKED_EXAMPLE_FAMILY_COUNT = 53;
export const EXPECTED_WORKED_EXAMPLE_CASE_COUNT = 106;
export const EXPECTED_QUANTITATIVE_LESSON_COUNT = 113;
export const EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT = 226;
export const EXPECTED_WORKED_EXAMPLE_TYPED_DISPLAY_CLAIM_COUNT = 1136;

export interface WorkedExampleInput {
  value: number;
  unit: string;
  minimum: number;
  maximum: number;
  displayedValueRequired?: boolean;
  displayBindingMode?: "implicit-coefficient" | "shared-equal-inputs";
  displayOmissionReason?: string;
}

export type WorkedExampleInputs = Readonly<Record<string, WorkedExampleInput>>;
export type WorkedExampleOracleOutput = Readonly<Record<string, number>>;

export type WorkedExampleAssertionRelation =
  | "equals"
  | "approximately-equals"
  | "less-than-or-equal";

export interface WorkedExampleOutputAssertion {
  outputId: string;
  expectedValue: number;
  canonicalUnit: string;
  relation: WorkedExampleAssertionRelation;
  absoluteTolerance: number;
  relativeTolerance: number;
  displayFragment: string;
}

export interface IndependentWorkedExampleCase {
  id: string;
  familyId: string;
  sourceExampleIndex: 1 | 2;
  oracleId: WorkedExampleOracleId;
  displayFingerprint: string;
  displayNumericClaimCount: number;
  displayNumericClaimsFingerprint: string;
  displayTypedClaimCount: number;
  displayTypedClaimsFingerprint: string;
  displayTypedClaimBindings: readonly WorkedExampleTypedClaimBinding[];
  displayUnitImplicitClaimIds: readonly string[];
  inputs: WorkedExampleInputs;
  assertions: readonly WorkedExampleOutputAssertion[];
}

export interface WorkedExampleFamilyVerification {
  familyId: string;
  formulaSignature: string;
  cases: readonly [IndependentWorkedExampleCase, IndependentWorkedExampleCase];
}

export type WorkedExampleFamilyRegistry = Readonly<
  Record<string, WorkedExampleFamilyVerification>
>;

export interface QuantitativeLessonFormulaAssignment {
  lessonId: string;
  familyId: string;
}

export interface WorkedExampleVerificationInstance {
  id: string;
  workedExampleId: string;
  lessonId: string;
  familyId: string;
  caseId: string;
  oracleId: WorkedExampleOracleId;
}

export interface WorkedExampleProductionOutputBinding {
  outputId: string;
  value: number;
  canonicalUnit: string;
}

export interface WorkedExampleProductionBinding {
  id: string;
  verificationCaseId: string;
  verificationOutputs: readonly WorkedExampleProductionOutputBinding[];
}

export interface WorkedExampleDisplaySource {
  problem: string;
  steps: readonly string[];
  result: string;
  independentCheck: string;
}

export interface WorkedExampleNumericDisplayClaim {
  claimId: string;
  field: "problem" | "step" | "result" | "independent-check";
  fieldIndex: number;
  rawNumber: string;
  numericValue: number;
  sign: -1 | 0 | 1;
  relation: "stated" | "equals" | "less-than-or-equal" | "approximately-equals";
  displayUnit: string;
  absoluteTolerance: number;
  relativeTolerance: number;
  leadingContext: string;
  trailingContext: string;
}

export type WorkedExampleTypedClaimKind =
  | "input"
  | "intermediate"
  | "conversion"
  | "output"
  | "constant"
  | "check";

export interface WorkedExampleTypedClaimSource {
  sourceId: string;
  kind: WorkedExampleTypedClaimKind;
  dependencyIds: readonly string[];
  claimIds: readonly string[];
  value: number;
  canonicalUnit: string;
  acceptedDisplayUnits: readonly string[];
  absoluteTolerance: number;
  relativeTolerance: number;
}

export interface WorkedExampleTypedDisplayClaim {
  claimId: string;
  sourceId: string;
  kind: WorkedExampleTypedClaimKind;
  dependencyIds: readonly string[];
  expectedValue: number;
  canonicalUnit: string;
  displayUnit: string;
  relation: WorkedExampleNumericDisplayClaim["relation"];
  absoluteTolerance: number;
  relativeTolerance: number;
}

export interface WorkedExampleTypedClaimBinding {
  claimId: string;
  sourceId: string;
  expectedDisplayUnit: string;
  expectedRelation: WorkedExampleNumericDisplayClaim["relation"];
  absoluteTolerance: number;
  relativeTolerance: number;
}

export type WorkedExampleDisplayRegistry = Readonly<
  Record<string, readonly WorkedExampleDisplaySource[]>
>;

export interface WorkedExampleVerificationIssue {
  code: string;
  path: string;
  message: string;
}

export interface WorkedExampleVerificationQualityManifest {
  schemaVersion: "3";
  fingerprint: string;
  status: "pass" | "fail";
  familyCount: number;
  caseCount: number;
  outputAssertionCount: number;
  typedDisplayClaimCount: number;
  quantitativeLessonCount: number;
  instanceCount: number;
  issueCount: number;
}

type NumericInputs = Readonly<Record<string, number>>;
type IndependentWorkedExampleOracle = (
  inputs: NumericInputs
) => WorkedExampleOracleOutput;

const numericInput = (inputs: NumericInputs, name: string): number => {
  const value = inputs[name];
  if (!Number.isFinite(value)) {
    throw new Error(`Independent oracle input ${name} must be finite.`);
  }
  return value;
};

const sumInputs = (inputs: NumericInputs, names: readonly string[]): number =>
  names.reduce((total, name) => total + numericInput(inputs, name), 0);

const productInputs = (
  inputs: NumericInputs,
  names: readonly string[]
): number =>
  names.reduce((product, name) => product * numericInput(inputs, name), 1);

const weightedMean = (
  inputs: NumericInputs,
  pairs: readonly (readonly [string, string])[]
): number => {
  const weightedTotal = pairs.reduce(
    (total, [weightName, valueName]) =>
      total
      + numericInput(inputs, weightName) * numericInput(inputs, valueName),
    0
  );
  const weightTotal = pairs.reduce(
    (total, [weightName]) => total + numericInput(inputs, weightName),
    0
  );
  return weightedTotal / weightTotal;
};

const firstOrderResponse = (inputs: NumericInputs): number =>
  numericInput(inputs, "finalValue")
  * (
    1
    - Math.exp(
      -numericInput(inputs, "time") / numericInput(inputs, "timeConstant")
    )
  );

const naturalFrequency = (inputs: NumericInputs): number =>
  Math.sqrt(
    numericInput(inputs, "stiffness") / numericInput(inputs, "mass")
  ) / (2 * Math.PI);

const coulombForce = (inputs: NumericInputs): number =>
  numericInput(inputs, "coulombConstant")
  * Math.abs(
    numericInput(inputs, "chargeOne") * numericInput(inputs, "chargeTwo")
  )
  / numericInput(inputs, "separation") ** 2;

const heatConductionRate = (inputs: NumericInputs): number =>
  numericInput(inputs, "conductivity")
  * numericInput(inputs, "area")
  * numericInput(inputs, "temperatureDifference")
  / numericInput(inputs, "thickness");

const machiningSurfaceSpeed = (inputs: NumericInputs): number =>
  Math.PI
  * numericInput(inputs, "diameter")
  * numericInput(inputs, "revolutionsPerMinute")
  / 60;

const rcCutoffFrequency = (inputs: NumericInputs): number =>
  1
  / (
    2
    * Math.PI
    * numericInput(inputs, "resistance")
    * numericInput(inputs, "capacitance")
  );

const bayesPosterior = (inputs: NumericInputs): number => {
  const prior = numericInput(inputs, "prior");
  const sensitivity = numericInput(inputs, "sensitivity");
  const falsePositiveRate = numericInput(inputs, "falsePositiveRate");
  return (
    sensitivity * prior
    / (
      sensitivity * prior
      + falsePositiveRate * (1 - prior)
    )
  );
};

const diodeCurrentMilliamps = (inputs: NumericInputs): number =>
  numericInput(inputs, "saturationCurrentNanoamps")
  * 1e-9
  * (
    Math.exp(
      numericInput(inputs, "junctionVoltage")
      / (
        numericInput(inputs, "idealityFactor")
        * numericInput(inputs, "thermalVoltage")
      )
    ) - 1
  ) * 1000;

const kalmanOutputs = (inputs: NumericInputs): WorkedExampleOracleOutput => {
  const predictedState = numericInput(inputs, "predictedState");
  const predictedVariance = numericInput(inputs, "predictedVariance");
  const measurement = numericInput(inputs, "measurement");
  const measurementVariance = numericInput(inputs, "measurementVariance");
  const gain = predictedVariance / (
    predictedVariance + measurementVariance
  );
  return {
    gain,
    posteriorState: predictedState + gain * (measurement - predictedState),
    posteriorVariance: (1 - gain) * predictedVariance
  };
};

const extendedKalmanOutputs = (
  inputs: NumericInputs
): WorkedExampleOracleOutput => {
  const predictedState = numericInput(inputs, "predictedState");
  const predictedVariance = numericInput(inputs, "predictedVariance");
  const measurement = numericInput(inputs, "measurement");
  const measurementVariance = numericInput(inputs, "measurementVariance");
  const observationJacobian = 2 * predictedState;
  const innovationCovariance = (
    observationJacobian ** 2 * predictedVariance
    + measurementVariance
  );
  const gain = (
    predictedVariance * observationJacobian / innovationCovariance
  );
  return {
    observationJacobian,
    innovationCovariance,
    gain,
    posteriorState: (
      predictedState
      + gain * (measurement - predictedState ** 2)
    )
  };
};

export const independentWorkedExampleOracles = {
  "sum-CASE-01": (inputs) => ({
    totalMinutes: sumInputs(inputs, ["a", "b", "c", "d"])
  }),
  "sum-CASE-02": (inputs) => {
    const totalSeconds = sumInputs(inputs, ["a", "b", "c"]);
    return { totalSeconds, totalMinutes: totalSeconds / 60 };
  },
  "ratio-CASE-01": (inputs) => ({
    ratio: numericInput(inputs, "distanceOutput")
      / numericInput(inputs, "distanceInput")
  }),
  "ratio-CASE-02": (inputs) => ({
    ratio: numericInput(inputs, "acceptableCount")
      / numericInput(inputs, "totalCount")
  }),
  "linear-CASE-01": (inputs) => ({
    output: (
      numericInput(inputs, "slope")
      * numericInput(inputs, "input")
      + numericInput(inputs, "intercept")
    )
  }),
  "linear-CASE-02": (inputs) => ({
    output: (
      numericInput(inputs, "slope")
      * numericInput(inputs, "input")
      + numericInput(inputs, "intercept")
    )
  }),
  "vector-CASE-01": (inputs) => ({
    magnitude: Math.hypot(
      numericInput(inputs, "x"),
      numericInput(inputs, "y")
    )
  }),
  "vector-CASE-02": (inputs) => ({
    magnitude: Math.hypot(
      numericInput(inputs, "x"),
      numericInput(inputs, "y")
    )
  }),
  "eigen-CASE-01": (inputs) => ({
    eigenvalue: numericInput(inputs, "diagonalOne")
  }),
  "eigen-CASE-02": (inputs) => ({
    eigenvalue: numericInput(inputs, "diagonalTwo")
  }),
  "inverseDerivative-CASE-01": (inputs) => ({
    inverseSlope: 1 / numericInput(inputs, "directSlope")
  }),
  "inverseDerivative-CASE-02": (inputs) => ({
    inverseSlope: 1 / (2 * numericInput(inputs, "x"))
  }),
  "derivative-CASE-01": (inputs) => ({
    velocity: (
      2
      * numericInput(inputs, "quadraticCoefficient")
      * numericInput(inputs, "time")
    )
  }),
  "derivative-CASE-02": (inputs) => ({
    velocity: (
      numericInput(inputs, "finalPosition")
      - numericInput(inputs, "initialPosition")
    ) / numericInput(inputs, "duration")
  }),
  "integral-CASE-01": (inputs) => ({
    accumulatedVolume: (
      numericInput(inputs, "flowRate") * numericInput(inputs, "duration")
    )
  }),
  "integral-CASE-02": (inputs) => ({
    energy: numericInput(inputs, "power") * numericInput(inputs, "duration")
  }),
  "force-CASE-01": (inputs) => ({
    force: numericInput(inputs, "mass") * numericInput(inputs, "acceleration")
  }),
  "force-CASE-02": (inputs) => ({
    acceleration: numericInput(inputs, "force") / numericInput(inputs, "mass")
  }),
  "stress-CASE-01": (inputs) => ({
    stress: numericInput(inputs, "force")
      / numericInput(inputs, "areaSquareMillimetres")
  }),
  "stress-CASE-02": (inputs) => ({
    stress: (
      numericInput(inputs, "force")
      / (
        numericInput(inputs, "width")
        * numericInput(inputs, "height")
      )
    )
  }),
  "power-CASE-01": (inputs) => ({
    power: (
      numericInput(inputs, "torque")
      * numericInput(inputs, "angularSpeed")
    )
  }),
  "power-CASE-02": (inputs) => ({
    torque: (
      numericInput(inputs, "power")
      / numericInput(inputs, "angularSpeed")
    )
  }),
  "ohm-CASE-01": (inputs) => ({
    voltage: (
      numericInput(inputs, "currentMilliamps")
      / 1000
      * numericInput(inputs, "resistance")
    )
  }),
  "ohm-CASE-02": (inputs) => ({
    resistance: numericInput(inputs, "voltage")
      / numericInput(inputs, "current")
  }),
  "timing-CASE-01": (inputs) => {
    const durationSeconds = numericInput(inputs, "count")
      / numericInput(inputs, "frequency");
    return {
      durationSeconds,
      durationMilliseconds: durationSeconds * 1000
    };
  },
  "timing-CASE-02": (inputs) => {
    const durationSeconds = numericInput(inputs, "count")
      / numericInput(inputs, "frequency");
    return {
      durationSeconds,
      durationMilliseconds: durationSeconds * 1000
    };
  },
  "sampling-CASE-01": (inputs) => ({
    minimumSamplingFrequency: 2 * numericInput(inputs, "maximumFrequency")
  }),
  "sampling-CASE-02": (inputs) => ({
    maximumFrequency: numericInput(inputs, "samplingFrequency") / 2
  }),
  "control-CASE-01": (inputs) => ({
    command: (
      numericInput(inputs, "gain")
      * (
        numericInput(inputs, "reference")
        - numericInput(inputs, "output")
      )
    )
  }),
  "control-CASE-02": (inputs) => ({
    commandPercent: (
      numericInput(inputs, "gainPercentPerDegree")
      * (
        numericInput(inputs, "reference")
        - numericInput(inputs, "output")
      )
    )
  }),
  "robot-CASE-01": (inputs) => ({
    linearSpeed: (
      numericInput(inputs, "rightWheelSpeed")
      + numericInput(inputs, "leftWheelSpeed")
    ) / 2,
    angularSpeed: (
      numericInput(inputs, "rightWheelSpeed")
      - numericInput(inputs, "leftWheelSpeed")
    ) / numericInput(inputs, "wheelbase")
  }),
  "robot-CASE-02": (inputs) => ({
    linearSpeed: (
      numericInput(inputs, "rightWheelSpeed")
      + numericInput(inputs, "leftWheelSpeed")
    ) / 2,
    angularSpeed: (
      numericInput(inputs, "rightWheelSpeed")
      - numericInput(inputs, "leftWheelSpeed")
    ) / numericInput(inputs, "wheelbase")
  }),
  "estimate-CASE-01": (inputs) => ({
    estimate: weightedMean(inputs, [
      ["weightOne", "measurementOne"],
      ["weightTwo", "measurementTwo"]
    ])
  }),
  "estimate-CASE-02": (inputs) => ({
    estimate: weightedMean(inputs, [
      ["weightOne", "measurementOne"],
      ["weightTwo", "measurementTwo"]
    ])
  }),
  "pinhole-CASE-01": (inputs) => ({
    pixelCoordinate: (
      numericInput(inputs, "focalLengthPixels")
      * numericInput(inputs, "horizontalCoordinate")
      / numericInput(inputs, "depth")
      + numericInput(inputs, "principalPoint")
    )
  }),
  "pinhole-CASE-02": (inputs) => ({
    horizontalCoordinate: (
      (
        numericInput(inputs, "pixelCoordinate")
        - numericInput(inputs, "principalPoint")
      )
      * numericInput(inputs, "depth")
      / numericInput(inputs, "focalLengthPixels")
    )
  }),
  "metric-CASE-01": (inputs) => {
    const precision = numericInput(inputs, "truePositive")
      / (
        numericInput(inputs, "truePositive")
        + numericInput(inputs, "falsePositive")
      );
    return { precision, precisionPercent: precision * 100 };
  },
  "metric-CASE-02": (inputs) => {
    const precision = numericInput(inputs, "truePositive")
      / (
        numericInput(inputs, "truePositive")
        + numericInput(inputs, "falsePositive")
      );
    return { precision, precisionPercent: precision * 100 };
  },
  "uncertainty-CASE-01": (inputs) => ({
    combinedUncertainty: Math.hypot(
      numericInput(inputs, "uncertaintyOne"),
      numericInput(inputs, "uncertaintyTwo")
    )
  }),
  "uncertainty-CASE-02": (inputs) => ({
    combinedUncertainty: Math.hypot(
      numericInput(inputs, "uncertaintyOne"),
      numericInput(inputs, "uncertaintyTwo")
    )
  }),
  "partialSensitivity-CASE-01": (inputs) => ({
    sensitivity: numericInput(inputs, "outputChange")
      / numericInput(inputs, "inputChange")
  }),
  "partialSensitivity-CASE-02": (inputs) => ({
    sensitivity: numericInput(inputs, "outputChange")
      / numericInput(inputs, "inputChange")
  }),
  "firstOrderStep-CASE-01": (inputs) => ({
    response: firstOrderResponse(inputs)
  }),
  "firstOrderStep-CASE-02": (inputs) => ({
    response: firstOrderResponse(inputs)
  }),
  "mean-CASE-01": (inputs) => ({
    mean: sumInputs(inputs, ["a", "b", "c"]) / 3
  }),
  "mean-CASE-02": (inputs) => ({
    mean: sumInputs(inputs, ["a", "b", "c", "d"]) / 4
  }),
  "oscillation-CASE-01": (inputs) => ({
    naturalFrequency: naturalFrequency(inputs)
  }),
  "oscillation-CASE-02": (inputs) => ({
    naturalFrequency: naturalFrequency(inputs)
  }),
  "coulomb-CASE-01": (inputs) => ({
    forceMagnitude: coulombForce(inputs)
  }),
  "coulomb-CASE-02": (inputs) => ({
    forceMagnitude: coulombForce(inputs)
  }),
  "heatConduction-CASE-01": (inputs) => ({
    heatRate: heatConductionRate(inputs)
  }),
  "heatConduction-CASE-02": (inputs) => ({
    heatRate: heatConductionRate(inputs)
  }),
  "spring-CASE-01": (inputs) => ({
    force: numericInput(inputs, "stiffness")
      * numericInput(inputs, "displacement")
  }),
  "spring-CASE-02": (inputs) => ({
    stiffness: numericInput(inputs, "force")
      / numericInput(inputs, "displacement")
  }),
  "machiningSpeed-CASE-01": (inputs) => ({
    surfaceSpeed: machiningSurfaceSpeed(inputs)
  }),
  "machiningSpeed-CASE-02": (inputs) => ({
    surfaceSpeed: machiningSurfaceSpeed(inputs)
  }),
  "rcCutoff-CASE-01": (inputs) => ({
    cutoffFrequency: rcCutoffFrequency(inputs)
  }),
  "rcCutoff-CASE-02": (inputs) => ({
    cutoffFrequency: rcCutoffFrequency(inputs)
  }),
  "adcResolution-CASE-01": (inputs) => {
    const resolutionVolts = numericInput(inputs, "referenceVoltage")
      / 2 ** numericInput(inputs, "bitCount");
    return {
      resolutionVolts,
      resolutionMillivolts: resolutionVolts * 1000
    };
  },
  "adcResolution-CASE-02": (inputs) => ({
    resolutionVolts: numericInput(inputs, "referenceVoltage")
      / 2 ** numericInput(inputs, "bitCount")
  }),
  "pwmDuty-CASE-01": (inputs) => {
    const dutyRatio = numericInput(inputs, "onTime")
      / numericInput(inputs, "period");
    return { dutyRatio, dutyPercent: dutyRatio * 100 };
  },
  "pwmDuty-CASE-02": (inputs) => {
    const periodMilliseconds = 1 / numericInput(
      inputs,
      "frequencyKilohertz"
    );
    const dutyRatio = numericInput(inputs, "onTimeMilliseconds")
      / periodMilliseconds;
    return {
      periodMilliseconds,
      dutyRatio,
      dutyPercent: dutyRatio * 100
    };
  },
  "fourier-CASE-01": (inputs) => ({
    dcCoefficient: sumInputs(inputs, ["sampleZero", "sampleOne", "sampleTwo", "sampleThree"])
  }),
  "fourier-CASE-02": (inputs) => ({
    dcCoefficient: sumInputs(inputs, ["sampleZero", "sampleOne", "sampleTwo", "sampleThree"])
  }),
  "stateSpace-CASE-01": (inputs) => ({
    stateDerivative: (
      numericInput(inputs, "stateCoefficient") * numericInput(inputs, "state")
      + numericInput(inputs, "inputCoefficient") * numericInput(inputs, "input")
    )
  }),
  "stateSpace-CASE-02": (inputs) => ({
    stateDerivative: (
      numericInput(inputs, "stateCoefficient") * numericInput(inputs, "state")
      + numericInput(inputs, "inputCoefficient") * numericInput(inputs, "input")
    )
  }),
  "rigidTransform-CASE-01": (inputs) => {
    const angleRadians = numericInput(inputs, "angleDegrees") * Math.PI / 180;
    return {
      rotatedX: (
        numericInput(inputs, "x") * Math.cos(angleRadians)
        - numericInput(inputs, "y") * Math.sin(angleRadians)
      )
    };
  },
  "rigidTransform-CASE-02": (inputs) => {
    const angleRadians = numericInput(inputs, "angleDegrees") * Math.PI / 180;
    return {
      rotatedX: (
        numericInput(inputs, "x") * Math.cos(angleRadians)
        - numericInput(inputs, "y") * Math.sin(angleRadians)
      )
    };
  },
  "jacobian-CASE-01": (inputs) => ({
    taskVelocity: numericInput(inputs, "jacobian")
      * numericInput(inputs, "jointRate")
  }),
  "jacobian-CASE-02": (inputs) => ({
    taskVelocity: numericInput(inputs, "jacobian")
      * numericInput(inputs, "jointRate")
  }),
  "inertia-CASE-01": (inputs) => ({
    inertia: numericInput(inputs, "mass") * numericInput(inputs, "radius") ** 2
  }),
  "inertia-CASE-02": (inputs) => ({
    inertia: numericInput(inputs, "mass") * numericInput(inputs, "radius") ** 2
  }),
  "bayes-CASE-01": (inputs) => ({
    posterior: bayesPosterior(inputs)
  }),
  "bayes-CASE-02": (inputs) => ({
    posterior: bayesPosterior(inputs)
  }),
  "pathCost-CASE-01": (inputs) => ({
    totalCost: numericInput(inputs, "accumulatedCost")
      + numericInput(inputs, "heuristicCost")
  }),
  "pathCost-CASE-02": (inputs) => ({
    totalCost: numericInput(inputs, "accumulatedCost")
      + numericInput(inputs, "heuristicCost")
  }),
  "neuron-CASE-01": (inputs) => ({
    affineOutput: (
      numericInput(inputs, "weightOne") * numericInput(inputs, "featureOne")
      + numericInput(inputs, "weightTwo") * numericInput(inputs, "featureTwo")
      + numericInput(inputs, "bias")
    )
  }),
  "neuron-CASE-02": (inputs) => ({
    affineOutput: (
      numericInput(inputs, "weightOne") * numericInput(inputs, "featureOne")
      + numericInput(inputs, "weightTwo") * numericInput(inputs, "featureTwo")
      + numericInput(inputs, "bias")
    )
  }),
  "gradientDescent-CASE-01": (inputs) => ({
    updatedParameter: (
      numericInput(inputs, "parameter")
      - numericInput(inputs, "learningRate") * numericInput(inputs, "gradient")
    )
  }),
  "gradientDescent-CASE-02": (inputs) => ({
    updatedParameter: (
      numericInput(inputs, "parameter")
      - numericInput(inputs, "learningRate") * numericInput(inputs, "gradient")
    )
  }),
  "compression-CASE-01": (inputs) => ({
    compressionRatio: numericInput(inputs, "originalSize")
      / numericInput(inputs, "compressedSize")
  }),
  "compression-CASE-02": (inputs) => ({
    compressionRatio: numericInput(inputs, "originalSize")
      / numericInput(inputs, "compressedSize")
  }),
  "tradeScore-CASE-01": (inputs) => ({
    weightedScore: (
      numericInput(inputs, "weightOne") * numericInput(inputs, "scoreOne")
      + numericInput(inputs, "weightTwo") * numericInput(inputs, "scoreTwo")
    )
  }),
  "tradeScore-CASE-02": (inputs) => ({
    weightedScore: (
      numericInput(inputs, "weightOne") * numericInput(inputs, "scoreOne")
      + numericInput(inputs, "weightTwo") * numericInput(inputs, "scoreTwo")
      + numericInput(inputs, "weightThree") * numericInput(inputs, "scoreThree")
    )
  }),
  "riskScore-CASE-01": (inputs) => ({
    riskScore: numericInput(inputs, "likelihoodRank")
      * numericInput(inputs, "consequenceRank")
  }),
  "riskScore-CASE-02": (inputs) => ({
    riskScore: numericInput(inputs, "likelihoodRank")
      * numericInput(inputs, "consequenceRank")
  }),
  "complexMagnitude-CASE-01": (inputs) => ({
    magnitude: Math.hypot(
      numericInput(inputs, "real"),
      numericInput(inputs, "imaginary")
    )
  }),
  "complexMagnitude-CASE-02": (inputs) => ({
    magnitude: Math.hypot(
      numericInput(inputs, "real"),
      numericInput(inputs, "imaginary")
    )
  }),
  "toleranceStack-CASE-01": (inputs) => ({
    worstCaseTolerance: sumInputs(
      inputs,
      ["toleranceOne", "toleranceTwo", "toleranceThree"]
    )
  }),
  "toleranceStack-CASE-02": (inputs) => ({
    worstCaseTolerance: sumInputs(
      inputs,
      ["toleranceOne", "toleranceTwo"]
    )
  }),
  "probability-CASE-01": (inputs) => ({
    probability: numericInput(inputs, "eventCount")
      / numericInput(inputs, "totalCount")
  }),
  "probability-CASE-02": (inputs) => ({
    probability: numericInput(inputs, "eventCount")
      / numericInput(inputs, "totalCount")
  }),
  "featureMatchRatio-CASE-01": (inputs) => ({
    matchRatio: numericInput(inputs, "nearestDistance")
      / numericInput(inputs, "secondNearestDistance")
  }),
  "featureMatchRatio-CASE-02": (inputs) => ({
    matchRatio: numericInput(inputs, "nearestDistance")
      / numericInput(inputs, "secondNearestDistance")
  }),
  "transferMagnitude-CASE-01": (inputs) => ({
    transferMagnitude: numericInput(inputs, "outputAmplitude")
      / numericInput(inputs, "inputAmplitude")
  }),
  "transferMagnitude-CASE-02": (inputs) => ({
    transferMagnitude: numericInput(inputs, "outputAmplitude")
      / numericInput(inputs, "inputAmplitude")
  }),
  "pid-CASE-01": (inputs) => ({
    command: (
      numericInput(inputs, "proportionalGain") * numericInput(inputs, "error")
      + numericInput(inputs, "integralGain")
        * numericInput(inputs, "integralError")
      + numericInput(inputs, "derivativeGain")
        * numericInput(inputs, "errorRate")
    )
  }),
  "pid-CASE-02": (inputs) => ({
    command: (
      numericInput(inputs, "proportionalGain") * numericInput(inputs, "error")
      + numericInput(inputs, "integralGain")
        * numericInput(inputs, "integralError")
    )
  }),
  "reliability-CASE-01": (inputs) => ({
    reliability: productInputs(inputs, ["reliabilityOne", "reliabilityTwo"])
  }),
  "reliability-CASE-02": (inputs) => ({
    reliability: productInputs(
      inputs,
      ["reliabilityOne", "reliabilityTwo", "reliabilityThree"]
    )
  }),
  "diodeShockley-CASE-01": (inputs) => ({
    diodeCurrent: diodeCurrentMilliamps(inputs)
  }),
  "diodeShockley-CASE-02": (inputs) => ({
    diodeCurrent: diodeCurrentMilliamps(inputs)
  }),
  "kalmanUpdate-CASE-01": kalmanOutputs,
  "kalmanUpdate-CASE-02": kalmanOutputs,
  "extendedKalmanUpdate-CASE-01": extendedKalmanOutputs,
  "extendedKalmanUpdate-CASE-02": extendedKalmanOutputs
} satisfies Record<string, IndependentWorkedExampleOracle>;

export type WorkedExampleOracleId =
  keyof typeof independentWorkedExampleOracles;

export const independentWorkedExampleOracleUnitContracts = {
  "sum-CASE-01": { totalMinutes: "min" },
  "sum-CASE-02": { totalSeconds: "s", totalMinutes: "min" },
  "ratio-CASE-01": { ratio: "1" },
  "ratio-CASE-02": { ratio: "1" },
  "linear-CASE-01": { output: "mV" },
  "linear-CASE-02": { output: "V" },
  "vector-CASE-01": { magnitude: "m" },
  "vector-CASE-02": { magnitude: "m" },
  "eigen-CASE-01": { eigenvalue: "1" },
  "eigen-CASE-02": { eigenvalue: "1" },
  "inverseDerivative-CASE-01": { inverseSlope: "1" },
  "inverseDerivative-CASE-02": { inverseSlope: "1" },
  "derivative-CASE-01": { velocity: "m/s" },
  "derivative-CASE-02": { velocity: "m/s" },
  "integral-CASE-01": { accumulatedVolume: "L" },
  "integral-CASE-02": { energy: "J" },
  "force-CASE-01": { force: "N" },
  "force-CASE-02": { acceleration: "m/s^2" },
  "stress-CASE-01": { stress: "MPa" },
  "stress-CASE-02": { stress: "MPa" },
  "power-CASE-01": { power: "W" },
  "power-CASE-02": { torque: "N m" },
  "ohm-CASE-01": { voltage: "V" },
  "ohm-CASE-02": { resistance: "ohm" },
  "timing-CASE-01": {
    durationSeconds: "s",
    durationMilliseconds: "ms"
  },
  "timing-CASE-02": {
    durationSeconds: "s",
    durationMilliseconds: "ms"
  },
  "sampling-CASE-01": { minimumSamplingFrequency: "Hz" },
  "sampling-CASE-02": { maximumFrequency: "Hz" },
  "control-CASE-01": { command: "V" },
  "control-CASE-02": { commandPercent: "percent" },
  "robot-CASE-01": { linearSpeed: "m/s", angularSpeed: "rad/s" },
  "robot-CASE-02": { linearSpeed: "m/s", angularSpeed: "rad/s" },
  "estimate-CASE-01": { estimate: "m" },
  "estimate-CASE-02": { estimate: "deg" },
  "pinhole-CASE-01": { pixelCoordinate: "px" },
  "pinhole-CASE-02": { horizontalCoordinate: "m" },
  "metric-CASE-01": { precision: "1", precisionPercent: "percent" },
  "metric-CASE-02": { precision: "1", precisionPercent: "percent" },
  "uncertainty-CASE-01": { combinedUncertainty: "mm" },
  "uncertainty-CASE-02": { combinedUncertainty: "K" },
  "partialSensitivity-CASE-01": { sensitivity: "V/kPa" },
  "partialSensitivity-CASE-02": { sensitivity: "K/W" },
  "firstOrderStep-CASE-01": { response: "V" },
  "firstOrderStep-CASE-02": { response: "K" },
  "mean-CASE-01": { mean: "V" },
  "mean-CASE-02": { mean: "s" },
  "oscillation-CASE-01": { naturalFrequency: "Hz" },
  "oscillation-CASE-02": { naturalFrequency: "Hz" },
  "coulomb-CASE-01": { forceMagnitude: "N" },
  "coulomb-CASE-02": { forceMagnitude: "N" },
  "heatConduction-CASE-01": { heatRate: "W" },
  "heatConduction-CASE-02": { heatRate: "W" },
  "spring-CASE-01": { force: "N" },
  "spring-CASE-02": { stiffness: "N/m" },
  "machiningSpeed-CASE-01": { surfaceSpeed: "m/s" },
  "machiningSpeed-CASE-02": { surfaceSpeed: "m/s" },
  "rcCutoff-CASE-01": { cutoffFrequency: "Hz" },
  "rcCutoff-CASE-02": { cutoffFrequency: "Hz" },
  "adcResolution-CASE-01": {
    resolutionVolts: "V",
    resolutionMillivolts: "mV"
  },
  "adcResolution-CASE-02": { resolutionVolts: "V" },
  "pwmDuty-CASE-01": { dutyRatio: "1", dutyPercent: "percent" },
  "pwmDuty-CASE-02": {
    periodMilliseconds: "ms",
    dutyRatio: "1",
    dutyPercent: "percent"
  },
  "fourier-CASE-01": { dcCoefficient: "V" },
  "fourier-CASE-02": { dcCoefficient: "V" },
  "stateSpace-CASE-01": { stateDerivative: "1/s" },
  "stateSpace-CASE-02": { stateDerivative: "1/s" },
  "rigidTransform-CASE-01": { rotatedX: "m" },
  "rigidTransform-CASE-02": { rotatedX: "m" },
  "jacobian-CASE-01": { taskVelocity: "m/s" },
  "jacobian-CASE-02": { taskVelocity: "m/s" },
  "inertia-CASE-01": { inertia: "kg m^2" },
  "inertia-CASE-02": { inertia: "kg m^2" },
  "bayes-CASE-01": { posterior: "1" },
  "bayes-CASE-02": { posterior: "1" },
  "pathCost-CASE-01": { totalCost: "m" },
  "pathCost-CASE-02": { totalCost: "1" },
  "neuron-CASE-01": { affineOutput: "1" },
  "neuron-CASE-02": { affineOutput: "1" },
  "gradientDescent-CASE-01": { updatedParameter: "1" },
  "gradientDescent-CASE-02": { updatedParameter: "1" },
  "compression-CASE-01": { compressionRatio: "1" },
  "compression-CASE-02": { compressionRatio: "1" },
  "tradeScore-CASE-01": { weightedScore: "1" },
  "tradeScore-CASE-02": { weightedScore: "1" },
  "riskScore-CASE-01": { riskScore: "1" },
  "riskScore-CASE-02": { riskScore: "1" },
  "complexMagnitude-CASE-01": { magnitude: "V" },
  "complexMagnitude-CASE-02": { magnitude: "ohm" },
  "toleranceStack-CASE-01": { worstCaseTolerance: "mm" },
  "toleranceStack-CASE-02": { worstCaseTolerance: "mm" },
  "probability-CASE-01": { probability: "1" },
  "probability-CASE-02": { probability: "1" },
  "featureMatchRatio-CASE-01": { matchRatio: "1" },
  "featureMatchRatio-CASE-02": { matchRatio: "1" },
  "transferMagnitude-CASE-01": { transferMagnitude: "1" },
  "transferMagnitude-CASE-02": { transferMagnitude: "1" },
  "pid-CASE-01": { command: "actuator unit" },
  "pid-CASE-02": { command: "actuator unit" },
  "reliability-CASE-01": { reliability: "1" },
  "reliability-CASE-02": { reliability: "1" },
  "diodeShockley-CASE-01": { diodeCurrent: "mA" },
  "diodeShockley-CASE-02": { diodeCurrent: "mA" },
  "kalmanUpdate-CASE-01": {
    gain: "1",
    posteriorState: "m",
    posteriorVariance: "m^2"
  },
  "kalmanUpdate-CASE-02": {
    gain: "1",
    posteriorState: "deg",
    posteriorVariance: "deg^2"
  },
  "extendedKalmanUpdate-CASE-01": {
    observationJacobian: "m",
    innovationCovariance: "m^4",
    gain: "1/m",
    posteriorState: "m"
  },
  "extendedKalmanUpdate-CASE-02": {
    observationJacobian: "m",
    innovationCovariance: "m^4",
    gain: "1/m",
    posteriorState: "m"
  }
} satisfies {
  [OracleId in WorkedExampleOracleId]: Readonly<Record<string, string>>;
};

export const evaluateIndependentWorkedExampleOracle = (
  oracleId: WorkedExampleOracleId,
  inputs: WorkedExampleInputs
): WorkedExampleOracleOutput => {
  const numericInputs = Object.fromEntries(
    Object.entries(inputs).map(([name, currentInput]) => [
      name,
      currentInput.value
    ])
  );
  const output = independentWorkedExampleOracles[oracleId](numericInputs);
  for (const [outputId, value] of Object.entries(output)) {
    if (!outputId.trim() || !Number.isFinite(value)) {
      throw new Error(
        `Independent oracle ${oracleId} produced an invalid ${outputId || "unnamed"} output.`
      );
    }
  }
  return output;
};

interface WorkedExampleTypedClaimContext {
  caseId: WorkedExampleOracleId;
  familyId: string;
  inputs: WorkedExampleInputs;
  outputs: WorkedExampleOracleOutput;
}

type SupplementalClaimSourceSeed = Omit<
  WorkedExampleTypedClaimSource,
  "value"
> & {
  evaluate: (context: WorkedExampleTypedClaimContext) => number;
};

const equivalentDisplayUnitGroups: readonly (readonly string[])[] = [
  ["MPa", "N/mm^2"],
  ["1/s", "per second"],
  ["W", "J/s"],
  ["microcoulomb", "microcoulombs"],
  ["cycles/ms", "cycles per millisecond"]
];

const equivalentDisplayUnitsFor = (
  canonicalUnit: string
): readonly string[] => (
  equivalentDisplayUnitGroups.find((group) =>
    group.includes(canonicalUnit)
  ) ?? [canonicalUnit]
);

const areEquivalentDisplayUnits = (
  canonicalUnit: string,
  displayUnit: string
): boolean => equivalentDisplayUnitsFor(canonicalUnit).includes(displayUnit);

const typedSource = (
  sourceId: string,
  kind: WorkedExampleTypedClaimKind,
  canonicalUnit: string,
  dependencyIds: readonly string[],
  claimIds: readonly string[],
  evaluate: SupplementalClaimSourceSeed["evaluate"],
  acceptedDisplayUnits: readonly string[] = [canonicalUnit],
  absoluteTolerance = 1e-12,
  relativeTolerance = 1e-12
): SupplementalClaimSourceSeed => {
  const normalisedDisplayUnits = [
    ...new Set([
      ...equivalentDisplayUnitsFor(canonicalUnit),
      ...acceptedDisplayUnits
    ])
  ];
  return {
    sourceId,
    kind,
    dependencyIds,
    claimIds,
    canonicalUnit,
    acceptedDisplayUnits: normalisedDisplayUnits,
    absoluteTolerance,
    relativeTolerance,
    evaluate
  };
};

const typedConstant = (
  sourceId: string,
  value: number,
  claimIds: readonly string[],
  canonicalUnit = "1",
  acceptedDisplayUnits: readonly string[] = [canonicalUnit]
): SupplementalClaimSourceSeed =>
  typedSource(
    sourceId,
    "constant",
    canonicalUnit,
    [],
    claimIds,
    () => value,
    acceptedDisplayUnits,
    0,
    0
  );

const inputClaimValue = (
  context: WorkedExampleTypedClaimContext,
  inputId: string
): number => numericInput(
  Object.fromEntries(
    Object.entries(context.inputs).map(([name, inputDefinition]) => [
      name,
      inputDefinition.value
    ])
  ),
  inputId
);

const outputClaimValue = (
  context: WorkedExampleTypedClaimContext,
  outputId: string
): number => {
  const value = context.outputs[outputId];
  if (!Number.isFinite(value)) {
    throw new Error(
      `Typed claim source output ${outputId} is absent or nonfinite.`
    );
  }
  return value;
};

const supplementalTypedClaimSourceSeeds = (
  context: WorkedExampleTypedClaimContext
): readonly SupplementalClaimSourceSeed[] => {
  const currentCase = context.caseId;
  const source = (
    sourceId: string,
    kind: WorkedExampleTypedClaimKind,
    canonicalUnit: string,
    dependencyIds: readonly string[],
    claimIds: readonly string[],
    evaluate: SupplementalClaimSourceSeed["evaluate"],
    acceptedDisplayUnits: readonly string[] = [canonicalUnit],
    absoluteTolerance = 1e-12,
    relativeTolerance = 1e-12
  ): SupplementalClaimSourceSeed => typedSource(
    sourceId,
    kind,
    canonicalUnit,
    dependencyIds,
    claimIds,
    evaluate,
    acceptedDisplayUnits,
    absoluteTolerance,
    relativeTolerance
  );
  const constant = (
    sourceId: string,
    value: number,
    claimIds: readonly string[],
    canonicalUnit = "1",
    acceptedDisplayUnits: readonly string[] = [canonicalUnit]
  ): SupplementalClaimSourceSeed => typedConstant(
    sourceId,
    value,
    claimIds,
    canonicalUnit,
    acceptedDisplayUnits
  );

  switch (currentCase) {
    case "sum-CASE-01":
      return [
        source(
          "intermediate:paired-subtotal",
          "intermediate",
          "min",
          ["input:a", "input:c"],
          ["CHECK-NUMERIC-005"],
          (current) => (
            inputClaimValue(current, "a") + inputClaimValue(current, "c")
          )
        )
      ];
    case "sum-CASE-02":
      return [
        constant(
          "constant:seconds-per-minute",
          60,
          ["STEP-02-NUMERIC-001", "STEP-03-NUMERIC-002"],
          "s"
        ),
        constant(
          "constant:one-minute",
          1,
          ["STEP-02-NUMERIC-002"],
          "min"
        ),
        source(
          "conversion:a-minutes",
          "conversion",
          "min",
          ["input:a", "constant:seconds-per-minute"],
          ["CHECK-NUMERIC-001"],
          (current) => inputClaimValue(current, "a") / 60
        ),
        source(
          "conversion:b-minutes",
          "conversion",
          "min",
          ["input:b", "constant:seconds-per-minute"],
          ["CHECK-NUMERIC-002"],
          (current) => inputClaimValue(current, "b") / 60
        ),
        source(
          "conversion:c-minutes",
          "conversion",
          "min",
          ["input:c", "constant:seconds-per-minute"],
          ["CHECK-NUMERIC-003"],
          (current) => inputClaimValue(current, "c") / 60
        )
      ];
    case "linear-CASE-01":
    case "linear-CASE-02":
      return [
        source(
          "intermediate:scaled-input",
          "intermediate",
          currentCase === "linear-CASE-01" ? "mV" : "V",
          ["input:slope", "input:input"],
          currentCase === "linear-CASE-01"
            ? ["STEP-03-NUMERIC-001", "CHECK-NUMERIC-002"]
            : ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "slope")
            * inputClaimValue(current, "input")
          )
        )
      ];
    case "vector-CASE-01":
    case "vector-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          currentCase === "vector-CASE-01"
            ? [
                "STEP-01-NUMERIC-002",
                "STEP-01-NUMERIC-004",
                "STEP-02-NUMERIC-002",
                "STEP-02-NUMERIC-004",
                "STEP-03-NUMERIC-002"
              ]
            : [
                "STEP-02-NUMERIC-002",
                "STEP-02-NUMERIC-004",
                "STEP-02-NUMERIC-006",
                "CHECK-NUMERIC-002",
                "CHECK-NUMERIC-004"
              ]
        ),
        source(
          "intermediate:x-square",
          "intermediate",
          "m^2",
          ["input:x"],
          ["STEP-02-NUMERIC-001"],
          (current) => inputClaimValue(current, "x") ** 2
        ),
        source(
          "intermediate:y-square",
          "intermediate",
          "m^2",
          ["input:y"],
          ["STEP-02-NUMERIC-003"],
          (current) => inputClaimValue(current, "y") ** 2
        ),
        source(
          "intermediate:sum-of-squares",
          "intermediate",
          "m^2",
          ["intermediate:x-square", "intermediate:y-square"],
          currentCase === "vector-CASE-01"
            ? ["STEP-03-NUMERIC-001"]
            : ["STEP-02-NUMERIC-005", "CHECK-NUMERIC-003"],
          (current) => (
            inputClaimValue(current, "x") ** 2
            + inputClaimValue(current, "y") ** 2
          )
        )
      ];
    case "eigen-CASE-01":
    case "eigen-CASE-02":
      return [
        source(
          "intermediate:matrix-vector-first",
          "intermediate",
          "1",
          ["input:diagonalOne", "input:vectorOne"],
          currentCase === "eigen-CASE-01"
            ? ["STEP-01-NUMERIC-001", "STEP-02-NUMERIC-001"]
            : ["STEP-01-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "diagonalOne")
            * inputClaimValue(current, "vectorOne")
          )
        ),
        source(
          "intermediate:matrix-vector-second",
          "intermediate",
          "1",
          ["input:diagonalTwo", "input:vectorTwo"],
          currentCase === "eigen-CASE-01"
            ? ["STEP-01-NUMERIC-002", "STEP-02-NUMERIC-002"]
            : ["STEP-01-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "diagonalTwo")
            * inputClaimValue(current, "vectorTwo")
          )
        ),
        source(
          "check:eigen-residual-first",
          "check",
          "1",
          ["input:diagonalOne", "input:vectorOne", "output:eigenvalue"],
          ["CHECK-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "diagonalOne")
            * inputClaimValue(current, "vectorOne")
            - outputClaimValue(current, "eigenvalue")
            * inputClaimValue(current, "vectorOne")
          )
        ),
        source(
          "check:eigen-residual-second",
          "check",
          "1",
          ["input:diagonalTwo", "input:vectorTwo", "output:eigenvalue"],
          ["CHECK-NUMERIC-003"],
          (current) => (
            inputClaimValue(current, "diagonalTwo")
            * inputClaimValue(current, "vectorTwo")
            - outputClaimValue(current, "eigenvalue")
            * inputClaimValue(current, "vectorTwo")
          )
        )
      ];
    case "inverseDerivative-CASE-01":
      return [
        constant(
          "constant:affine-intercept",
          3,
          ["PROBLEM-NUMERIC-002", "CHECK-NUMERIC-001"]
        )
      ];
    case "inverseDerivative-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "PROBLEM-NUMERIC-001",
            "STEP-01-NUMERIC-001",
            "CHECK-NUMERIC-002"
          ]
        ),
        constant(
          "constant:positive-domain-boundary",
          0,
          ["PROBLEM-NUMERIC-002"]
        ),
        constant(
          "constant:reciprocal-numerator",
          1,
          ["CHECK-NUMERIC-001", "CHECK-NUMERIC-004"]
        ),
        source(
          "intermediate:direct-slope",
          "intermediate",
          "1",
          ["constant:square-exponent", "input:x"],
          ["STEP-02-NUMERIC-002", "CHECK-NUMERIC-005"],
          (current) => 2 * inputClaimValue(current, "x")
        ),
        source(
          "output-component:inverse-slope-numerator",
          "output",
          "1",
          ["output:inverseSlope", "intermediate:direct-slope"],
          ["RESULT-NUMERIC-001"],
          (current) => (
            outputClaimValue(current, "inverseSlope")
            * 2
            * inputClaimValue(current, "x")
          )
        ),
        source(
          "output-component:inverse-slope-denominator",
          "output",
          "1",
          ["output:inverseSlope"],
          ["RESULT-NUMERIC-002"],
          (current) => 1 / outputClaimValue(current, "inverseSlope")
        ),
        source(
          "check:squared-input",
          "check",
          "1",
          ["input:x", "constant:square-exponent"],
          ["CHECK-NUMERIC-003"],
          (current) => inputClaimValue(current, "x") ** 2
        )
      ];
    case "derivative-CASE-01":
      return [
        constant(
          "constant:square-exponent",
          2,
          ["PROBLEM-NUMERIC-002"]
        ),
        source(
          "intermediate:derivative-coefficient",
          "intermediate",
          "m/s^2",
          ["input:quadraticCoefficient"],
          ["STEP-01-NUMERIC-001", "STEP-03-NUMERIC-001"],
          (current) => 2 * inputClaimValue(current, "quadraticCoefficient")
        )
      ];
    case "derivative-CASE-02":
      return [
        source(
          "intermediate:position-change",
          "intermediate",
          "m",
          ["input:finalPosition", "input:initialPosition"],
          [
            "STEP-01-NUMERIC-001",
            "STEP-03-NUMERIC-001",
            "CHECK-NUMERIC-003"
          ],
          (current) => (
            inputClaimValue(current, "finalPosition")
            - inputClaimValue(current, "initialPosition")
          )
        )
      ];
    case "integral-CASE-02":
      return [
        source(
          "conversion:energy-kilojoules",
          "conversion",
          "kJ",
          ["output:energy"],
          ["CHECK-NUMERIC-001"],
          (current) => outputClaimValue(current, "energy") / 1000
        )
      ];
    case "force-CASE-01":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "PROBLEM-NUMERIC-003",
            "STEP-01-NUMERIC-003",
            "STEP-03-NUMERIC-001",
            "CHECK-NUMERIC-004"
          ]
        )
      ];
    case "force-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          ["RESULT-NUMERIC-002", "CHECK-NUMERIC-003"]
        )
      ];
    case "stress-CASE-01":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "PROBLEM-NUMERIC-003",
            "STEP-01-NUMERIC-002",
            "STEP-01-NUMERIC-004",
            "STEP-02-NUMERIC-003",
            "CHECK-NUMERIC-002"
          ]
        ),
        source(
          "conversion:area-square-metres",
          "conversion",
          "m^2",
          ["input:areaSquareMillimetres"],
          ["STEP-01-NUMERIC-003", "STEP-02-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "areaSquareMillimetres") * 1e-6
          )
        )
      ];
    case "stress-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "STEP-01-NUMERIC-002",
            "STEP-02-NUMERIC-003",
            "STEP-03-NUMERIC-002",
            "CHECK-NUMERIC-003"
          ]
        ),
        source(
          "intermediate:section-area",
          "intermediate",
          "mm^2",
          ["input:width", "input:height"],
          [
            "STEP-01-NUMERIC-001",
            "STEP-02-NUMERIC-002",
            "CHECK-NUMERIC-002"
          ],
          (current) => (
            inputClaimValue(current, "width")
            * inputClaimValue(current, "height")
          )
        ),
        constant(
          "constant:megapascal-equivalence",
          1,
          ["STEP-03-NUMERIC-001", "STEP-03-NUMERIC-003"],
          "MPa",
          ["N/mm^2", "MPa"]
        )
      ];
    case "ohm-CASE-01":
      return [
        source(
          "conversion:current-amperes",
          "conversion",
          "A",
          ["input:currentMilliamps"],
          [
            "STEP-01-NUMERIC-002",
            "STEP-02-NUMERIC-001",
            "CHECK-NUMERIC-003"
          ],
          (current) => inputClaimValue(current, "currentMilliamps") / 1000
        )
      ];
    case "timing-CASE-01":
      return [
        source(
          "conversion:frequency-megahertz",
          "conversion",
          "MHz",
          ["input:frequency"],
          [
            "PROBLEM-NUMERIC-002",
            "STEP-01-NUMERIC-001",
            "CHECK-NUMERIC-001"
          ],
          (current) => inputClaimValue(current, "frequency") / 1e6
        ),
        source(
          "conversion:cycles-per-millisecond",
          "conversion",
          "cycles/ms",
          ["input:frequency"],
          ["CHECK-NUMERIC-002"],
          (current) => inputClaimValue(current, "frequency") / 1000
        )
      ];
    case "timing-CASE-02":
      return [
        source(
          "conversion:frequency-kilohertz",
          "conversion",
          "kHz",
          ["input:frequency"],
          ["PROBLEM-NUMERIC-001"],
          (current) => inputClaimValue(current, "frequency") / 1000
        ),
        source(
          "conversion:cycle-period-milliseconds",
          "conversion",
          "ms",
          ["input:frequency"],
          ["CHECK-NUMERIC-001"],
          (current) => 1000 / inputClaimValue(current, "frequency")
        )
      ];
    case "sampling-CASE-01":
      return [
        constant(
          "constant:nyquist-factor",
          2,
          ["STEP-01-NUMERIC-001"]
        )
      ];
    case "sampling-CASE-02":
      return [
        constant(
          "constant:nyquist-factor",
          2,
          ["STEP-01-NUMERIC-001", "STEP-02-NUMERIC-002"]
        )
      ];
    case "control-CASE-01":
      return [
        source(
          "intermediate:error",
          "intermediate",
          "rad/s",
          ["input:reference", "input:output"],
          [
            "STEP-01-NUMERIC-003",
            "STEP-02-NUMERIC-002",
            "CHECK-NUMERIC-003"
          ],
          (current) => (
            inputClaimValue(current, "reference")
            - inputClaimValue(current, "output")
          )
        )
      ];
    case "control-CASE-02":
      return [
        source(
          "intermediate:error",
          "intermediate",
          "deg C",
          ["input:reference", "input:output"],
          ["STEP-01-NUMERIC-001", "CHECK-NUMERIC-003"],
          (current) => (
            inputClaimValue(current, "reference")
            - inputClaimValue(current, "output")
          )
        ),
        constant(
          "constant:actuator-lower-bound",
          0,
          ["STEP-03-NUMERIC-001"],
          "percent"
        ),
        constant(
          "constant:actuator-upper-bound",
          100,
          ["STEP-03-NUMERIC-002"],
          "percent"
        )
      ];
    case "robot-CASE-01":
      return [
        source(
          "input-group:equal-wheel-speeds",
          "input",
          "m/s",
          ["input:rightWheelSpeed", "input:leftWheelSpeed"],
          ["PROBLEM-NUMERIC-001"],
          (current) => {
            const rightWheelSpeed = inputClaimValue(
              current,
              "rightWheelSpeed"
            );
            const leftWheelSpeed = inputClaimValue(
              current,
              "leftWheelSpeed"
            );
            if (rightWheelSpeed !== leftWheelSpeed) {
              throw new Error(
                "Shared wheel-speed display requires equal named inputs."
              );
            }
            return rightWheelSpeed;
          }
        )
      ];
    case "robot-CASE-02":
      return [
        constant(
          "constant:wheel-average-divisor",
          2,
          [
            "STEP-01-NUMERIC-003",
            "CHECK-NUMERIC-001",
            "CHECK-NUMERIC-003"
          ]
        )
      ];
    case "estimate-CASE-01":
      return [
        source(
          "intermediate:weighted-total",
          "intermediate",
          "m",
          [
            "input:measurementOne",
            "input:measurementTwo",
            "input:weightOne",
            "input:weightTwo"
          ],
          ["STEP-01-NUMERIC-005", "STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "measurementOne")
              * inputClaimValue(current, "weightOne")
            + inputClaimValue(current, "measurementTwo")
              * inputClaimValue(current, "weightTwo")
          )
        ),
        source(
          "intermediate:weight-total",
          "intermediate",
          "1",
          ["input:weightOne", "input:weightTwo"],
          ["STEP-02-NUMERIC-003", "STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "weightOne")
            + inputClaimValue(current, "weightTwo")
          )
        )
      ];
    case "estimate-CASE-02":
      return [
        source(
          "intermediate:weighted-total",
          "intermediate",
          "deg",
          ["input:measurementOne", "input:measurementTwo"],
          ["STEP-01-NUMERIC-003"],
          (current) => (
            inputClaimValue(current, "measurementOne")
            + inputClaimValue(current, "measurementTwo")
          )
        ),
        source(
          "intermediate:weight-total",
          "intermediate",
          "1",
          ["input:weightOne", "input:weightTwo"],
          ["STEP-02-NUMERIC-001", "STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "weightOne")
            + inputClaimValue(current, "weightTwo")
          )
        )
      ];
    case "pinhole-CASE-01":
      return [
        source(
          "intermediate:normalised-horizontal-coordinate",
          "intermediate",
          "1",
          ["input:horizontalCoordinate", "input:depth"],
          ["STEP-01-NUMERIC-001", "CHECK-NUMERIC-004"],
          (current) => (
            inputClaimValue(current, "horizontalCoordinate")
            / inputClaimValue(current, "depth")
          )
        )
      ];
    case "pinhole-CASE-02":
      return [
        source(
          "intermediate:pixel-offset",
          "intermediate",
          "px",
          ["input:pixelCoordinate", "input:principalPoint"],
          ["STEP-02-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "pixelCoordinate")
            - inputClaimValue(current, "principalPoint")
          )
        )
      ];
    case "metric-CASE-01":
    case "metric-CASE-02":
      return [
        source(
          "intermediate:predicted-positive-count",
          "intermediate",
          "count",
          ["input:truePositive", "input:falsePositive"],
          currentCase === "metric-CASE-01"
            ? ["STEP-01-NUMERIC-003", "STEP-02-NUMERIC-002", "CHECK-NUMERIC-002"]
            : ["STEP-01-NUMERIC-003", "STEP-02-NUMERIC-002", "CHECK-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "truePositive")
            + inputClaimValue(current, "falsePositive")
          )
        ),
        ...(currentCase === "metric-CASE-01"
          ? [source(
              "check:false-positive-percent",
              "check",
              "percent",
              [
                "input:falsePositive",
                "intermediate:predicted-positive-count"
              ],
              ["CHECK-NUMERIC-001"],
              (current) => (
                inputClaimValue(current, "falsePositive")
                / (
                  inputClaimValue(current, "truePositive")
                  + inputClaimValue(current, "falsePositive")
                )
                * 100
              )
            )]
          : [])
      ];
    case "uncertainty-CASE-01":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "STEP-02-NUMERIC-002",
            "STEP-02-NUMERIC-004",
            "CHECK-NUMERIC-002",
            "CHECK-NUMERIC-004",
            "CHECK-NUMERIC-006"
          ]
        ),
        source(
          "intermediate:variance-sum",
          "intermediate",
          "mm^2",
          ["input:uncertaintyOne", "input:uncertaintyTwo"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "uncertaintyOne") ** 2
            + inputClaimValue(current, "uncertaintyTwo") ** 2
          )
        )
      ];
    case "uncertainty-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          ["STEP-02-NUMERIC-002", "STEP-02-NUMERIC-004"]
        ),
        source(
          "check:arithmetic-sum",
          "check",
          "K",
          ["input:uncertaintyOne", "input:uncertaintyTwo"],
          ["CHECK-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "uncertaintyOne")
            + inputClaimValue(current, "uncertaintyTwo")
          )
        )
      ];
    case "firstOrderStep-CASE-01":
    case "firstOrderStep-CASE-02":
      return [
        constant(
          "constant:unity",
          1,
          ["STEP-02-NUMERIC-002"]
        ),
        source(
          "intermediate:negative-time",
          "intermediate",
          "s",
          ["input:time"],
          ["STEP-02-NUMERIC-003"],
          (current) => -inputClaimValue(current, "time")
        ),
        source(
          "intermediate:normalised-negative-time",
          "intermediate",
          "1",
          ["input:time", "input:timeConstant"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            -inputClaimValue(current, "time")
            / inputClaimValue(current, "timeConstant")
          )
        ),
        source(
          "intermediate:exponential-decay",
          "intermediate",
          "1",
          ["intermediate:normalised-negative-time"],
          ["STEP-03-NUMERIC-002"],
          (current) => Math.exp(
            -inputClaimValue(current, "time")
            / inputClaimValue(current, "timeConstant")
          )
        ),
        ...(currentCase === "firstOrderStep-CASE-01"
          ? [source(
              "check:response-percent",
              "check",
              "percent",
              ["output:response", "input:finalValue"],
              ["CHECK-NUMERIC-001"],
              (current) => (
                outputClaimValue(current, "response")
                / inputClaimValue(current, "finalValue")
                * 100
              )
            )]
          : [
              source(
                "check:remaining-error",
                "check",
                "K",
                ["input:finalValue", "output:response"],
                ["CHECK-NUMERIC-001"],
                (current) => (
                  inputClaimValue(current, "finalValue")
                  - outputClaimValue(current, "response")
                )
              ),
              source(
                "check:remaining-error-percent",
                "check",
                "percent",
                ["check:remaining-error", "input:finalValue"],
                ["CHECK-NUMERIC-002"],
                (current) => (
                  (
                    inputClaimValue(current, "finalValue")
                    - outputClaimValue(current, "response")
                  )
                  / inputClaimValue(current, "finalValue")
                  * 100
                )
              )
            ])
      ];
    case "mean-CASE-01":
    case "mean-CASE-02": {
      const divisor = currentCase === "mean-CASE-01" ? 3 : 4;
      const inputIds = currentCase === "mean-CASE-01"
        ? ["a", "b", "c"]
        : ["a", "b", "c", "d"];
      const totalClaimIds = ["STEP-03-NUMERIC-001"];
      const divisorClaimIds = currentCase === "mean-CASE-01"
        ? ["STEP-02-NUMERIC-004", "STEP-03-NUMERIC-002"]
        : ["STEP-02-NUMERIC-005", "STEP-03-NUMERIC-002"];
      const deviationSources = inputIds.flatMap(
        (inputId, index): SupplementalClaimSourceSeed[] => {
          const claimIds = currentCase === "mean-CASE-01"
            ? (
                index === 0
                  ? ["CHECK-NUMERIC-001"]
                  : index === 1
                    ? ["CHECK-NUMERIC-002"]
                    : []
              )
            : [[
                "CHECK-NUMERIC-001"
              ], [
                "CHECK-NUMERIC-002"
              ], [
                "CHECK-NUMERIC-003"
              ], [
                "CHECK-NUMERIC-004"
              ]][index] ?? [];
          if (claimIds.length === 0) return [];
          return [source(
            `check:${inputId}-deviation`,
            "check",
            currentCase === "mean-CASE-01" ? "V" : "s",
            [`input:${inputId}`, "output:mean"],
            claimIds,
            (current) => (
              inputClaimValue(current, inputId)
              - outputClaimValue(current, "mean")
            )
          )];
        }
      );
      return [
        constant(
          "constant:sample-count",
          divisor,
          divisorClaimIds
        ),
        source(
          "intermediate:sample-total",
          "intermediate",
          currentCase === "mean-CASE-01" ? "V" : "s",
          inputIds.map((inputId) => `input:${inputId}`),
          totalClaimIds,
          (current) => inputIds.reduce(
            (total, inputId) => total + inputClaimValue(current, inputId),
            0
          )
        ),
        ...deviationSources
      ];
    }
    case "oscillation-CASE-01":
    case "oscillation-CASE-02":
      return [
        constant(
          "constant:radians-to-cycles-factor",
          2,
          currentCase === "oscillation-CASE-01"
            ? ["STEP-02-NUMERIC-003", "STEP-03-NUMERIC-002"]
            : ["STEP-02-NUMERIC-003"]
        ),
        ...(currentCase === "oscillation-CASE-02"
          ? [source(
              "intermediate:stiffness-mass-ratio",
              "intermediate",
              "1/s^2",
              ["input:stiffness", "input:mass"],
              ["STEP-03-NUMERIC-001"],
              (current) => (
                inputClaimValue(current, "stiffness")
                / inputClaimValue(current, "mass")
              )
            )]
          : []),
        source(
          "intermediate:natural-angular-frequency",
          "intermediate",
          "rad/s",
          currentCase === "oscillation-CASE-01"
            ? ["input:stiffness", "input:mass"]
            : ["intermediate:stiffness-mass-ratio"],
          currentCase === "oscillation-CASE-01"
            ? ["STEP-03-NUMERIC-001"]
            : ["STEP-03-NUMERIC-002"],
          (current) => Math.sqrt(
            inputClaimValue(current, "stiffness")
            / inputClaimValue(current, "mass")
          )
        ),
        ...(currentCase === "oscillation-CASE-01"
          ? [source(
              "check:period",
              "check",
              "s",
              ["output:naturalFrequency"],
              ["CHECK-NUMERIC-003"],
              (current) => 1 / outputClaimValue(current, "naturalFrequency")
            )]
          : [])
      ];
    case "coulomb-CASE-01":
    case "coulomb-CASE-02":
      return [
        source(
          "conversion:charge-one-microcoulombs",
          "conversion",
          "microcoulomb",
          ["input:chargeOne"],
          ["PROBLEM-NUMERIC-001"],
          (current) => Math.abs(inputClaimValue(current, "chargeOne")) * 1e6,
          ["microcoulomb", "microcoulombs"]
        ),
        ...(currentCase === "coulomb-CASE-02"
          ? [source(
              "conversion:charge-two-microcoulombs",
              "conversion",
              "microcoulomb",
              ["input:chargeTwo"],
              ["PROBLEM-NUMERIC-002"],
              (current) => Math.abs(inputClaimValue(current, "chargeTwo")) * 1e6,
              ["microcoulomb", "microcoulombs"]
            )]
          : []),
        constant(
          "constant:square-exponent",
          2,
          ["STEP-02-NUMERIC-005"]
        )
      ];
    case "heatConduction-CASE-01":
    case "heatConduction-CASE-02":
      return [
        ...(currentCase === "heatConduction-CASE-01"
          ? [constant(
              "constant:square-exponent",
              2,
              ["PROBLEM-NUMERIC-003"]
            )]
          : []),
        source(
          "check:thermal-resistance",
          "check",
          "K/W",
          ["input:thickness", "input:conductivity", "input:area"],
          ["CHECK-NUMERIC-001", "CHECK-NUMERIC-003"],
          (current) => (
            inputClaimValue(current, "thickness")
            / (
              inputClaimValue(current, "conductivity")
              * inputClaimValue(current, "area")
            )
          )
        )
      ];
    case "machiningSpeed-CASE-01":
    case "machiningSpeed-CASE-02":
      return [
        source(
          "conversion:diameter-millimetres",
          "conversion",
          "mm",
          ["input:diameter"],
          ["PROBLEM-NUMERIC-001"],
          (current) => inputClaimValue(current, "diameter") * 1000
        ),
        constant(
          "constant:seconds-per-minute",
          60,
          currentCase === "machiningSpeed-CASE-01"
            ? ["STEP-02-NUMERIC-003", "CHECK-NUMERIC-003"]
            : ["STEP-02-NUMERIC-003"]
        ),
        ...(currentCase === "machiningSpeed-CASE-01"
          ? [source(
              "conversion:surface-speed-metres-per-minute",
              "conversion",
              "m/min",
              ["output:surfaceSpeed", "constant:seconds-per-minute"],
              ["CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
              (current) => (
                outputClaimValue(current, "surfaceSpeed") * 60
              )
            )]
          : [
              source(
                "check:distance-per-revolution",
                "check",
                "m",
                ["input:diameter"],
                ["CHECK-NUMERIC-002"],
                (current) => Math.PI * inputClaimValue(current, "diameter")
              ),
              source(
                "conversion:revolutions-per-second",
                "conversion",
                "1/s",
                ["input:revolutionsPerMinute", "constant:seconds-per-minute"],
                ["CHECK-NUMERIC-003"],
                (current) => (
                  inputClaimValue(current, "revolutionsPerMinute") / 60
                )
              )
            ])
      ];
    case "rcCutoff-CASE-01":
    case "rcCutoff-CASE-02":
      return [
        source(
          "conversion:resistance-display",
          "conversion",
          "kohm",
          ["input:resistance"],
          ["PROBLEM-NUMERIC-001"],
          (current) => inputClaimValue(current, "resistance") / 1000
        ),
        source(
          "conversion:capacitance-display",
          "conversion",
          currentCase === "rcCutoff-CASE-01" ? "microfarad" : "nF",
          ["input:capacitance"],
          ["PROBLEM-NUMERIC-002"],
          (current) => (
            currentCase === "rcCutoff-CASE-01"
              ? inputClaimValue(current, "capacitance") * 1e6
              : inputClaimValue(current, "capacitance") * 1e9
          )
        ),
        constant(
          "constant:reciprocal-numerator",
          1,
          currentCase === "rcCutoff-CASE-01"
            ? ["STEP-02-NUMERIC-001", "CHECK-NUMERIC-002"]
            : ["STEP-02-NUMERIC-001"]
        ),
        constant(
          "constant:radians-to-cycles-factor",
          2,
          currentCase === "rcCutoff-CASE-01"
            ? ["STEP-02-NUMERIC-002", "CHECK-NUMERIC-003"]
            : ["STEP-02-NUMERIC-002"]
        ),
        source(
          "intermediate:time-constant",
          "intermediate",
          "s",
          ["input:resistance", "input:capacitance"],
          currentCase === "rcCutoff-CASE-01"
            ? ["CHECK-NUMERIC-004"]
            : ["CHECK-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "resistance")
            * inputClaimValue(current, "capacitance")
          )
        ),
        source(
          "conversion:time-constant-milliseconds",
          "conversion",
          "ms",
          ["intermediate:time-constant"],
          currentCase === "rcCutoff-CASE-01"
            ? ["CHECK-NUMERIC-001"]
            : ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "resistance")
            * inputClaimValue(current, "capacitance")
            * 1000
          )
        )
      ];
    case "adcResolution-CASE-01":
    case "adcResolution-CASE-02":
      return [
        source(
          "intermediate:code-level-count",
          "intermediate",
          "levels",
          ["input:bitCount"],
          currentCase === "adcResolution-CASE-01"
            ? ["STEP-02-NUMERIC-002", "CHECK-NUMERIC-002"]
            : [
                "STEP-01-NUMERIC-001",
                "STEP-02-NUMERIC-002",
                "CHECK-NUMERIC-002"
          ],
          (current) => 2 ** inputClaimValue(current, "bitCount")
        )
      ];
    case "pwmDuty-CASE-02":
      return [
        source(
          "check:off-time",
          "check",
          "ms",
          ["output:periodMilliseconds", "input:onTimeMilliseconds"],
          ["CHECK-NUMERIC-001"],
          (current) => (
            outputClaimValue(current, "periodMilliseconds")
            - inputClaimValue(current, "onTimeMilliseconds")
          )
        )
      ];
    case "stateSpace-CASE-01":
      return [
        source(
          "intermediate:input-contribution",
          "intermediate",
          "1/s",
          ["input:inputCoefficient", "input:input"],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "inputCoefficient")
            * inputClaimValue(current, "input")
          )
        ),
        constant(
          "constant:euler-step-seconds",
          0.01,
          ["CHECK-NUMERIC-001"],
          "s"
        ),
        source(
          "check:euler-state-increment",
          "check",
          "1",
          ["output:stateDerivative", "constant:euler-step-seconds"],
          ["CHECK-NUMERIC-002"],
          (current) => outputClaimValue(current, "stateDerivative") * 0.01
        )
      ];
    case "stateSpace-CASE-02":
      return [
        source(
          "intermediate:state-contribution",
          "intermediate",
          "1/s",
          ["input:stateCoefficient", "input:state"],
          ["STEP-02-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "stateCoefficient")
            * inputClaimValue(current, "state")
          )
        )
      ];
    case "rigidTransform-CASE-01":
      return [
        source(
          "intermediate:cosine",
          "intermediate",
          "1",
          ["input:angleDegrees"],
          ["STEP-03-NUMERIC-002"],
          (current) => Math.cos(
            inputClaimValue(current, "angleDegrees") * Math.PI / 180
          )
        ),
        constant(
          "constant:radicand",
          3,
          ["CHECK-NUMERIC-002"]
        )
      ];
    case "rigidTransform-CASE-02":
      return [
        source(
          "intermediate:sine",
          "intermediate",
          "1",
          ["input:angleDegrees"],
          ["STEP-03-NUMERIC-002"],
          (current) => Math.sin(
            inputClaimValue(current, "angleDegrees") * Math.PI / 180
          )
        )
      ];
    case "inertia-CASE-01":
      return [
        constant(
          "constant:square-exponent",
          2,
          ["STEP-02-NUMERIC-003"]
        ),
        source(
          "check:doubled-radius",
          "check",
          "m",
          ["input:radius"],
          ["CHECK-NUMERIC-001"],
          (current) => 2 * inputClaimValue(current, "radius")
        ),
        source(
          "check:doubled-radius-inertia",
          "check",
          "kg m^2",
          ["input:mass", "check:doubled-radius"],
          ["CHECK-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "mass")
            * (2 * inputClaimValue(current, "radius")) ** 2
          )
        )
      ];
    case "inertia-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "STEP-02-NUMERIC-003",
            "STEP-02-NUMERIC-004",
            "RESULT-NUMERIC-002",
            "CHECK-NUMERIC-002"
          ]
        ),
        source(
          "intermediate:radius-square",
          "intermediate",
          "m^2",
          ["input:radius", "constant:square-exponent"],
          ["STEP-03-NUMERIC-002", "CHECK-NUMERIC-001"],
          (current) => inputClaimValue(current, "radius") ** 2
        )
      ];
    case "bayes-CASE-01":
    case "bayes-CASE-02":
      return [
        source(
          "intermediate:prior-complement",
          "intermediate",
          "1",
          ["input:prior"],
          ["STEP-02-NUMERIC-006"],
          (current) => 1 - inputClaimValue(current, "prior")
        ),
        source(
          "intermediate:true-alarm-term",
          "intermediate",
          "1",
          ["input:sensitivity", "input:prior"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "sensitivity")
            * inputClaimValue(current, "prior")
          )
        ),
        source(
          "intermediate:alarm-probability",
          "intermediate",
          "1",
          [
            "input:sensitivity",
            "input:prior",
            "input:falsePositiveRate",
            "intermediate:prior-complement"
          ],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "sensitivity")
              * inputClaimValue(current, "prior")
            + inputClaimValue(current, "falsePositiveRate")
              * (1 - inputClaimValue(current, "prior"))
          )
        ),
        ...(currentCase === "bayes-CASE-01"
          ? [
              constant(
                "constant:hypothetical-population",
                1000,
                ["CHECK-NUMERIC-001"],
                "cases"
              ),
              source(
                "check:true-alarm-count",
                "check",
                "count",
                [
                  "input:sensitivity",
                  "input:prior",
                  "constant:hypothetical-population"
                ],
                ["CHECK-NUMERIC-002", "CHECK-NUMERIC-004"],
                (current) => (
                  inputClaimValue(current, "sensitivity")
                  * inputClaimValue(current, "prior")
                  * 1000
                )
              ),
              source(
                "check:false-alarm-count",
                "check",
                "count",
                [
                  "input:falsePositiveRate",
                  "intermediate:prior-complement",
                  "constant:hypothetical-population"
                ],
                ["CHECK-NUMERIC-003"],
                (current) => (
                  inputClaimValue(current, "falsePositiveRate")
                  * (1 - inputClaimValue(current, "prior"))
                  * 1000
                )
              ),
              source(
                "check:alarm-count",
                "check",
                "count",
                ["check:true-alarm-count", "check:false-alarm-count"],
                ["CHECK-NUMERIC-005"],
                (current) => (
                  (
                    inputClaimValue(current, "sensitivity")
                    * inputClaimValue(current, "prior")
                  )
                  + (
                    inputClaimValue(current, "falsePositiveRate")
                    * (1 - inputClaimValue(current, "prior"))
                  )
                ) * 1000
              )
            ]
          : [])
      ];
    case "neuron-CASE-01":
      return [
        source(
          "intermediate:weighted-contribution-one",
          "intermediate",
          "1",
          ["input:weightOne", "input:featureOne"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "weightOne")
            * inputClaimValue(current, "featureOne")
          )
        ),
        source(
          "intermediate:weighted-contribution-two",
          "intermediate",
          "1",
          ["input:weightTwo", "input:featureTwo"],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "weightTwo")
            * inputClaimValue(current, "featureTwo")
          )
        ),
        source(
          "check:weighted-input-contribution",
          "check",
          "1",
          [
            "input:featureOne",
            "input:featureTwo",
            "input:weightOne",
            "input:weightTwo"
          ],
          ["CHECK-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "weightOne")
              * inputClaimValue(current, "featureOne")
            + inputClaimValue(current, "weightTwo")
              * inputClaimValue(current, "featureTwo")
          )
        )
      ];
    case "neuron-CASE-02":
      return [
        source(
          "intermediate:weighted-contribution-one",
          "intermediate",
          "1",
          ["input:weightOne", "input:featureOne"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "weightOne")
            * inputClaimValue(current, "featureOne")
          )
        ),
        source(
          "intermediate:weighted-contribution-two",
          "intermediate",
          "1",
          ["input:weightTwo", "input:featureTwo"],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "weightTwo")
            * inputClaimValue(current, "featureTwo")
          )
        ),
        source(
          "intermediate:bias-subtraction-magnitude",
          "intermediate",
          "1",
          ["input:bias"],
          ["STEP-02-NUMERIC-005"],
          (current) => Math.abs(inputClaimValue(current, "bias"))
        )
      ];
    case "gradientDescent-CASE-01":
    case "gradientDescent-CASE-02":
      return [
        source(
          "intermediate:update-step-magnitude",
          "intermediate",
          "1",
          ["input:learningRate", "input:gradient"],
          ["STEP-03-NUMERIC-001"],
          (current) => Math.abs(
            inputClaimValue(current, "learningRate")
            * inputClaimValue(current, "gradient")
          )
        )
      ];
    case "tradeScore-CASE-01":
      return [
        source(
          "intermediate:contribution-one",
          "intermediate",
          "1",
          ["input:weightOne", "input:scoreOne"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "weightOne")
            * inputClaimValue(current, "scoreOne")
          )
        ),
        source(
          "intermediate:contribution-two",
          "intermediate",
          "1",
          ["input:weightTwo", "input:scoreTwo"],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "weightTwo")
            * inputClaimValue(current, "scoreTwo")
          )
        )
      ];
    case "tradeScore-CASE-02":
      return [
        source(
          "intermediate:contribution-one",
          "intermediate",
          "1",
          ["input:weightOne", "input:scoreOne"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "weightOne")
            * inputClaimValue(current, "scoreOne")
          )
        ),
        source(
          "intermediate:contribution-two",
          "intermediate",
          "1",
          ["input:weightTwo", "input:scoreTwo"],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "weightTwo")
            * inputClaimValue(current, "scoreTwo")
          )
        ),
        source(
          "intermediate:contribution-three",
          "intermediate",
          "1",
          ["input:weightThree", "input:scoreThree"],
          ["STEP-03-NUMERIC-003"],
          (current) => (
            inputClaimValue(current, "weightThree")
            * inputClaimValue(current, "scoreThree")
          )
        )
      ];
    case "complexMagnitude-CASE-01":
    case "complexMagnitude-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          ["STEP-02-NUMERIC-002", "STEP-02-NUMERIC-004"]
        ),
        source(
          "intermediate:sum-of-squares",
          "intermediate",
          currentCase === "complexMagnitude-CASE-01"
            ? "V^2"
            : "ohm^2",
          ["input:real", "input:imaginary"],
          currentCase === "complexMagnitude-CASE-01"
            ? ["STEP-03-NUMERIC-001"]
            : ["STEP-03-NUMERIC-001", "CHECK-NUMERIC-004"],
          (current) => (
            inputClaimValue(current, "real") ** 2
            + inputClaimValue(current, "imaginary") ** 2
          )
        ),
        ...(currentCase === "complexMagnitude-CASE-02"
          ? [
              source(
                "check:real-square",
                "check",
                "ohm^2",
                ["input:real"],
                ["CHECK-NUMERIC-002"],
                (current) => inputClaimValue(current, "real") ** 2
              ),
              source(
                "check:imaginary-square",
                "check",
                "ohm^2",
                ["input:imaginary"],
                ["CHECK-NUMERIC-003"],
                (current) => inputClaimValue(current, "imaginary") ** 2
              )
            ]
          : [])
      ];
    case "pid-CASE-01":
      return [
        source(
          "intermediate:derivative-contribution",
          "intermediate",
          "actuator unit",
          ["input:derivativeGain", "input:errorRate"],
          ["STEP-03-NUMERIC-003"],
          (current) => (
            inputClaimValue(current, "derivativeGain")
            * inputClaimValue(current, "errorRate")
          )
        )
      ];
    case "pid-CASE-02":
      return [
        source(
          "intermediate:proportional-contribution",
          "intermediate",
          "actuator unit",
          ["input:proportionalGain", "input:error"],
          ["STEP-03-NUMERIC-001", "CHECK-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "proportionalGain")
            * inputClaimValue(current, "error")
          )
        ),
        source(
          "intermediate:integral-contribution",
          "intermediate",
          "actuator unit",
          ["input:integralGain", "input:integralError"],
          ["STEP-03-NUMERIC-002", "CHECK-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "integralGain")
            * inputClaimValue(current, "integralError")
          )
        )
      ];
    case "reliability-CASE-01":
      return [
        constant(
          "constant:certainty",
          1,
          ["CHECK-NUMERIC-001"]
        ),
        source(
          "check:failure-probability",
          "check",
          "1",
          ["constant:certainty", "output:reliability"],
          ["CHECK-NUMERIC-003"],
          (current) => 1 - outputClaimValue(current, "reliability")
        )
      ];
    case "diodeShockley-CASE-01":
      return [
        source(
          "conversion:thermal-voltage-millivolts",
          "conversion",
          "mV",
          ["input:thermalVoltage"],
          ["PROBLEM-NUMERIC-003"],
          (current) => inputClaimValue(current, "thermalVoltage") * 1000
        ),
        source(
          "conversion:diode-current-microamps",
          "conversion",
          "microamps",
          ["output:diodeCurrent"],
          ["CHECK-NUMERIC-001"],
          (current) => outputClaimValue(current, "diodeCurrent") * 1000
        )
      ];
    case "diodeShockley-CASE-02":
      return [
        constant(
          "constant:comparison-voltage-increase",
          0.1,
          ["CHECK-NUMERIC-001"],
          "V"
        )
      ];
    case "kalmanUpdate-CASE-01":
      return [
        source(
          "intermediate:innovation",
          "intermediate",
          "m",
          ["input:measurement", "input:predictedState"],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "measurement")
            - inputClaimValue(current, "predictedState")
          )
        )
      ];
    case "kalmanUpdate-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "PROBLEM-NUMERIC-003",
            "PROBLEM-NUMERIC-006",
            "RESULT-NUMERIC-003"
          ]
        ),
        source(
          "intermediate:innovation",
          "intermediate",
          "deg",
          ["input:measurement", "input:predictedState"],
          ["STEP-03-NUMERIC-001"],
          (current) => (
            inputClaimValue(current, "measurement")
            - inputClaimValue(current, "predictedState")
          )
        )
      ];
    case "extendedKalmanUpdate-CASE-01":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "PROBLEM-NUMERIC-001",
            "PROBLEM-NUMERIC-004",
            "PROBLEM-NUMERIC-006",
            "STEP-02-NUMERIC-005",
            "STEP-03-NUMERIC-003",
            "CHECK-NUMERIC-003",
            "CHECK-NUMERIC-005"
          ]
        ),
        constant(
          "constant:fourth-power-exponent",
          4,
          ["PROBLEM-NUMERIC-008", "STEP-02-NUMERIC-009"]
        ),
        constant(
          "constant:quadratic-derivative-coefficient",
          2,
          ["STEP-02-NUMERIC-001"]
        ),
        source(
          "intermediate:innovation",
          "intermediate",
          "m^2",
          ["input:measurement", "input:predictedState"],
          ["STEP-03-NUMERIC-002"],
          (current) => (
            inputClaimValue(current, "measurement")
            - inputClaimValue(current, "predictedState") ** 2
          )
        ),
        source(
          "check:nonlinear-posterior-observation",
          "check",
          "m^2",
          ["output:posteriorState"],
          ["CHECK-NUMERIC-002"],
          (current) => outputClaimValue(current, "posteriorState") ** 2
        )
      ];
    case "extendedKalmanUpdate-CASE-02":
      return [
        constant(
          "constant:square-exponent",
          2,
          [
            "PROBLEM-NUMERIC-003",
            "PROBLEM-NUMERIC-005",
            "STEP-02-NUMERIC-003",
            "STEP-03-NUMERIC-002",
            "CHECK-NUMERIC-002"
          ]
        ),
        constant(
          "constant:fourth-power-exponent",
          4,
          ["PROBLEM-NUMERIC-007", "STEP-02-NUMERIC-007"]
        ),
        source(
          "intermediate:innovation-magnitude",
          "intermediate",
          "m^2",
          ["input:measurement", "input:predictedState"],
          ["STEP-03-NUMERIC-001"],
          (current) => Math.abs(
            inputClaimValue(current, "measurement")
            - inputClaimValue(current, "predictedState") ** 2
          )
        ),
        source(
          "conversion:rounded-posterior-state",
          "conversion",
          "m",
          ["output:posteriorState"],
          ["RESULT-NUMERIC-001"],
          (current) => (
            Math.round(outputClaimValue(current, "posteriorState") * 1000)
            / 1000
          )
        ),
        source(
          "check:nonlinear-posterior-observation",
          "check",
          "m^2",
          ["output:posteriorState"],
          ["CHECK-NUMERIC-001"],
          (current) => outputClaimValue(current, "posteriorState") ** 2
        )
      ];
    default:
      return [];
  }
};

export const buildWorkedExampleTypedClaimSources = (
  verificationCase: IndependentWorkedExampleCase
): WorkedExampleTypedClaimSource[] => {
  const outputs = evaluateIndependentWorkedExampleOracle(
    verificationCase.oracleId,
    verificationCase.inputs
  );
  const context: WorkedExampleTypedClaimContext = {
    caseId: verificationCase.oracleId,
    familyId: verificationCase.familyId,
    inputs: verificationCase.inputs,
    outputs
  };
  const inputSources = Object.entries(verificationCase.inputs).map(
    ([inputId, inputDefinition]): WorkedExampleTypedClaimSource => ({
      sourceId: `input:${inputId}`,
      kind: "input",
      dependencyIds: [],
      claimIds: [],
      value: inputDefinition.value,
      canonicalUnit: inputDefinition.unit,
      acceptedDisplayUnits: equivalentDisplayUnitsFor(inputDefinition.unit),
      absoluteTolerance: 1e-12,
      relativeTolerance: 1e-12
    })
  );
  const assertionByOutputId = new Map(
    verificationCase.assertions.map((assertion) => [
      assertion.outputId,
      assertion
    ])
  );
  const outputSources = Object.entries(outputs).map(
    ([outputId, value]): WorkedExampleTypedClaimSource => {
      const assertion = assertionByOutputId.get(outputId);
      if (!assertion) {
        throw new Error(
          `Typed claim source ${verificationCase.id}:${outputId} has no assertion.`
        );
      }
      return {
        sourceId: `output:${outputId}`,
        kind: "output",
        dependencyIds: Object.keys(verificationCase.inputs)
          .map((inputId) => `input:${inputId}`),
        claimIds: [],
        value,
        canonicalUnit: assertion.canonicalUnit,
        acceptedDisplayUnits:
          equivalentDisplayUnitsFor(assertion.canonicalUnit),
        absoluteTolerance: assertion.absoluteTolerance,
        relativeTolerance: assertion.relativeTolerance
      };
    }
  );
  const supplementalSources = supplementalTypedClaimSourceSeeds(context)
    .map((seed): WorkedExampleTypedClaimSource => ({
      sourceId: seed.sourceId,
      kind: seed.kind,
      dependencyIds: seed.dependencyIds,
      claimIds: seed.claimIds,
      value: seed.evaluate(context),
      canonicalUnit: seed.canonicalUnit,
      acceptedDisplayUnits: seed.acceptedDisplayUnits,
      absoluteTolerance: seed.absoluteTolerance,
      relativeTolerance: seed.relativeTolerance
    }));
  return [...inputSources, ...outputSources, ...supplementalSources];
};

const issue = (
  issues: WorkedExampleVerificationIssue[],
  code: string,
  path: string,
  message: string
): void => {
  issues.push({ code, path, message });
};

const duplicateValues = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
};

const exceedsNumericTolerance = (
  firstValue: number,
  secondValue: number,
  tolerance: number
): boolean => {
  const floatingPointSlack = (
    Number.EPSILON
    * Math.max(1, Math.abs(firstValue), Math.abs(secondValue), tolerance)
    * 4
  );
  return Math.abs(firstValue - secondValue)
    > tolerance + floatingPointSlack;
};

const fnv1a32 = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const fingerprintWorkedExampleDisplaySource = (
  displaySource: WorkedExampleDisplaySource
): string => `fnv1a32:${fnv1a32(JSON.stringify({
  problem: displaySource.problem,
  steps: displaySource.steps,
  result: displaySource.result,
  independentCheck: displaySource.independentCheck
}))}`;

const displayedUnitPattern = new RegExp(
  (
    "^\\s*("
    + [
      "cycles per millisecond",
      "percent per deg C",
      "V per rad/s",
      "W/\\(m K\\)",
      "V/\\(rad/s\\)",
      "percent/deg C",
      "kg m\\^2",
      "m/s\\^2",
      "N/mm\\^2",
      "mV/kPa",
      "V/kPa",
      "cycles/ms",
      "rev/min",
      "m/min",
      "m/rad",
      "L/s",
      "J/s",
      "rad/s",
      "K/W",
      "V/kg",
      "N m",
      "N/m",
      "V squared",
      "ohm squared",
      "ohm\\^2",
      "V\\^2",
      "m\\^4",
      "m\\^2",
      "mm\\^2",
      "deg\\^2",
      "kg",
      "m/s",
      "rad",
      "MPa",
      "N",
      "mm",
      "mV",
      "mA",
      "nA",
      "V",
      "kPa",
      "kHz",
      "MHz",
      "Hz",
      "ms",
      "min",
      "s",
      "m",
      "L",
      "J",
      "W",
      "K",
      "deg C",
      "deg",
      "px",
      "ohm",
      "MB",
      "percent",
      "microamps?",
      "microcoulombs?",
      "cycles?",
      "samples?",
      "trials?",
      "outcomes?",
      "levels?",
      "bits?",
      "per second"
    ].join("|")
    + ")(?![A-Za-z0-9_])"
  ),
  "u"
);

const normalisedDisplayedUnitAliases: Readonly<Record<string, string>> = {
  "cycles per millisecond": "cycles/ms",
  "percent per deg C": "percent/deg C",
  "V per rad/s": "V/(rad/s)",
  "V squared": "V^2",
  "ohm squared": "ohm^2"
};

const normaliseDisplayedUnit = (displayUnit: string): string =>
  normalisedDisplayedUnitAliases[displayUnit] ?? displayUnit;

export const extractWorkedExampleNumericDisplayClaims = (
  displaySource: WorkedExampleDisplaySource
): WorkedExampleNumericDisplayClaim[] => {
  const fields = [
    {
      field: "problem" as const,
      fieldIndex: 0,
      claimPrefix: "PROBLEM",
      text: displaySource.problem
    },
    ...displaySource.steps.map((text, stepIndex) => ({
      field: "step" as const,
      fieldIndex: stepIndex + 1,
      claimPrefix: `STEP-${String(stepIndex + 1).padStart(2, "0")}`,
      text
    })),
    {
      field: "result" as const,
      fieldIndex: 0,
      claimPrefix: "RESULT",
      text: displaySource.result
    },
    {
      field: "independent-check" as const,
      fieldIndex: 0,
      claimPrefix: "CHECK",
      text: displaySource.independentCheck
    }
  ];
  const numberPattern = /[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/giu;
  const claims: WorkedExampleNumericDisplayClaim[] = [];
  for (const currentField of fields) {
    let fieldClaimIndex = 0;
    for (const match of currentField.text.matchAll(numberPattern)) {
      let matchIndex = match.index;
      let rawNumber = match[0];
      if (matchIndex === undefined) continue;
      const signIsSeparator = (
        /^[+-]/u.test(rawNumber)
        && /[\d.)]/u.test(currentField.text[matchIndex - 1] ?? "")
      );
      if (signIsSeparator) {
        matchIndex += 1;
        rawNumber = rawNumber.slice(1);
      }
      const precedingCharacter = currentField.text[matchIndex - 1] ?? "";
      if (/[A-Za-z_]/u.test(precedingCharacter)) continue;
      const numericValue = Number(rawNumber);
      if (!Number.isFinite(numericValue)) continue;
      fieldClaimIndex += 1;
      const matchEnd = matchIndex + rawNumber.length;
      const leadingText = currentField.text.slice(
        Math.max(0, matchIndex - 24),
        matchIndex
      );
      const trailingText = currentField.text.slice(
        matchEnd,
        Math.min(currentField.text.length, matchEnd + 32)
      );
      const rawDisplayUnit =
        trailingText.match(displayedUnitPattern)?.[1] ?? "";
      const displayUnit = normaliseDisplayedUnit(rawDisplayUnit);
      const decimalPlaces = rawNumber.includes(".")
        ? rawNumber.replace(/e.*$/iu, "").split(".")[1]?.length ?? 0
        : 0;
      const exponent = Number(rawNumber.match(/e([-+]?\d+)$/iu)?.[1] ?? 0);
      const absoluteTolerance = decimalPlaces > 0
        ? 0.5 * 10 ** (exponent - decimalPlaces)
        : 0;
      const relation = /<=\s*$/u.test(leadingText)
        ? "less-than-or-equal"
        : /(?:about|approximately|approaches)\s*$/iu.test(leadingText)
          ? "approximately-equals"
          : /=\s*$/u.test(leadingText)
            ? "equals"
            : "stated";
      claims.push({
        claimId: (
          `${currentField.claimPrefix}-NUMERIC-`
          + String(fieldClaimIndex).padStart(3, "0")
        ),
        field: currentField.field,
        fieldIndex: currentField.fieldIndex,
        rawNumber,
        numericValue,
        sign: Math.sign(numericValue) as -1 | 0 | 1,
        relation,
        displayUnit,
        absoluteTolerance,
        relativeTolerance: 0,
        leadingContext: leadingText.replace(/\s+/gu, " "),
        trailingContext: trailingText.replace(/\s+/gu, " ")
      });
    }
  }
  return claims;
};

export const fingerprintWorkedExampleNumericDisplayClaims = (
  displaySource: WorkedExampleDisplaySource
): string => `fnv1a32:${fnv1a32(JSON.stringify(
  extractWorkedExampleNumericDisplayClaims(displaySource)
))}`;

const numericLiteralAbsoluteToleranceCeiling = (
  rawNumber: string
): number => {
  const [significand, rawExponent = "0"] = rawNumber
    .replace(/^[+-]/u, "")
    .toLowerCase()
    .split("e");
  const decimalPlaces = significand.includes(".")
    ? significand.split(".")[1]?.length ?? 0
    : 0;
  const exponent = Number(rawExponent);
  return 0.5 * 10 ** (exponent - decimalPlaces);
};

export interface WorkedExampleTypedClaimResolution {
  sources: readonly WorkedExampleTypedClaimSource[];
  claims: readonly WorkedExampleTypedDisplayClaim[];
  issues: readonly WorkedExampleVerificationIssue[];
}

export const resolveWorkedExampleTypedDisplayClaims = (
  verificationCase: IndependentWorkedExampleCase,
  displaySource: WorkedExampleDisplaySource,
  sourceOverride?: readonly WorkedExampleTypedClaimSource[]
): WorkedExampleTypedClaimResolution => {
  const issues: WorkedExampleVerificationIssue[] = [];
  const casePath = `typed-claims.${verificationCase.id}`;
  let sources: WorkedExampleTypedClaimSource[] = [];
  try {
    sources = sourceOverride
      ? [...structuredClone(sourceOverride)]
      : buildWorkedExampleTypedClaimSources(verificationCase);
  } catch (error) {
    issue(
      issues,
      "typed-claim-source-evaluation",
      casePath,
      error instanceof Error ? error.message : String(error)
    );
  }
  const sourceIds = sources.map((source) => source.sourceId);
  const sourcesById = new Map(
    sources.map((source) => [source.sourceId, source])
  );
  for (const duplicate of duplicateValues(sourceIds)) {
    issue(
      issues,
      "duplicate-typed-claim-source",
      `${casePath}.${duplicate}`,
      "Typed claim source ID is duplicated."
    );
  }
  for (const source of sources) {
    const sourcePath = `${casePath}.${source.sourceId}`;
    if (
      !source.sourceId.trim()
      || !source.canonicalUnit.trim()
      || !Number.isFinite(source.value)
      || source.absoluteTolerance < 0
      || source.relativeTolerance < 0
    ) {
      issue(
        issues,
        "typed-claim-source-contract",
        sourcePath,
        "Typed claim source requires a finite value, unit and nonnegative tolerances."
      );
    }
    if (
      source.acceptedDisplayUnits.length === 0
      || source.acceptedDisplayUnits.some((unit) => !unit.trim())
      || !source.acceptedDisplayUnits.includes(source.canonicalUnit)
      || source.acceptedDisplayUnits.some((unit) =>
        !areEquivalentDisplayUnits(source.canonicalUnit, unit)
      )
      || new Set(source.acceptedDisplayUnits).size
        !== source.acceptedDisplayUnits.length
    ) {
      issue(
        issues,
        "typed-claim-source-unit-contract",
        sourcePath,
        "Typed claim source display units must be unique, canonical and dimensionally equivalent."
      );
    }
    if (
      source.kind === "constant"
      ? source.dependencyIds.length !== 0
      : (
          source.kind !== "input"
          && source.dependencyIds.length === 0
        )
    ) {
      issue(
        issues,
        "typed-claim-source-dependencies",
        sourcePath,
        "Typed constants have no dependencies; evaluated non-input sources require dependencies."
      );
    }
    for (const dependencyId of source.dependencyIds) {
      if (
        dependencyId === source.sourceId
        || !sourcesById.has(dependencyId)
      ) {
        issue(
          issues,
          "typed-claim-source-dependency",
          `${sourcePath}.${dependencyId}`,
          "Typed claim dependency is missing or self-referential."
        );
      }
    }
  }

  const visitingSourceIds = new Set<string>();
  const visitedSourceIds = new Set<string>();
  const reportedCycles = new Set<string>();
  const visitSource = (sourceId: string, path: readonly string[]): void => {
    if (visitedSourceIds.has(sourceId) || !sourcesById.has(sourceId)) return;
    if (visitingSourceIds.has(sourceId)) {
      const cycleStart = path.indexOf(sourceId);
      const cycle = [...path.slice(Math.max(0, cycleStart)), sourceId];
      const cycleKey = cycle.join(" -> ");
      if (!reportedCycles.has(cycleKey)) {
        reportedCycles.add(cycleKey);
        issue(
          issues,
          "typed-claim-source-cycle",
          `${casePath}.${sourceId}`,
          `Typed claim dependency cycle detected: ${cycleKey}.`
        );
      }
      return;
    }
    visitingSourceIds.add(sourceId);
    const source = sourcesById.get(sourceId);
    for (const dependencyId of source?.dependencyIds ?? []) {
      visitSource(dependencyId, [...path, sourceId]);
    }
    visitingSourceIds.delete(sourceId);
    visitedSourceIds.add(sourceId);
  };
  for (const sourceId of sourceIds) visitSource(sourceId, []);

  const numericClaims = extractWorkedExampleNumericDisplayClaims(displaySource);
  const numericClaimsById = new Map(
    numericClaims.map((claim) => [claim.claimId, claim])
  );
  const bindings = verificationCase.displayTypedClaimBindings;
  const bindingIds = bindings.map((binding) => binding.claimId);
  const bindingsByClaimId = new Map(
    bindings.map((binding) => [binding.claimId, binding])
  );
  const unitImplicitClaimIds =
    verificationCase.displayUnitImplicitClaimIds;
  const unitImplicitClaimIdSet = new Set(unitImplicitClaimIds);
  for (const duplicate of duplicateValues(bindingIds)) {
    issue(
      issues,
      "duplicate-typed-claim-binding",
      `${casePath}.${duplicate}`,
      "Typed display claim binding ID is duplicated."
    );
  }
  for (const duplicate of duplicateValues(unitImplicitClaimIds)) {
    issue(
      issues,
      "duplicate-unit-implicit-claim",
      `${casePath}.${duplicate}`,
      "Unit-implicit display claim ID is duplicated."
    );
  }
  for (const claimId of unitImplicitClaimIds) {
    const binding = bindingsByClaimId.get(claimId);
    if (!binding || !numericClaimsById.has(claimId)) {
      issue(
        issues,
        "orphan-unit-implicit-claim",
        `${casePath}.${claimId}`,
        "Unit-implicit contract targets a claim or binding that does not exist."
      );
    } else if (binding.expectedDisplayUnit !== "") {
      issue(
        issues,
        "invalid-unit-implicit-claim",
        `${casePath}.${claimId}`,
        "Unit-implicit contract targets a claim with an explicit display unit."
      );
    }
  }
  for (const binding of bindings) {
    const bindingPath = `${casePath}.${binding.claimId}`;
    if (
      !binding.claimId.trim()
      || !binding.sourceId.trim()
      || binding.absoluteTolerance < 0
      || binding.relativeTolerance < 0
      || !Number.isFinite(binding.absoluteTolerance)
      || !Number.isFinite(binding.relativeTolerance)
    ) {
      issue(
        issues,
        "typed-claim-binding-contract",
        bindingPath,
        "Typed binding requires claim/source IDs, relation and finite nonnegative tolerances."
      );
    }
    if (!sourcesById.has(binding.sourceId)) {
      issue(
        issues,
        "orphan-typed-claim-source-binding",
        bindingPath,
        "Typed display binding references an unknown independent source."
      );
    }
    if (!numericClaimsById.has(binding.claimId)) {
      issue(
        issues,
        "orphan-typed-claim-binding",
        bindingPath,
        "Typed binding targets a display claim that does not exist."
      );
    }
    const source = sourcesById.get(binding.sourceId);
    if (
      binding.expectedDisplayUnit === ""
      && !unitImplicitClaimIdSet.has(binding.claimId)
    ) {
      issue(
        issues,
        "missing-unit-implicit-contract",
        bindingPath,
        "Unitless display binding requires an exact per-claim implicit-unit contract."
      );
    } else if (
      source
      && binding.expectedDisplayUnit !== ""
      && !source.acceptedDisplayUnits.includes(binding.expectedDisplayUnit)
    ) {
      issue(
        issues,
        "typed-claim-source-unit",
        `${bindingPath}.${binding.sourceId}.`
          + (binding.expectedDisplayUnit || "unitless"),
        "Typed binding display unit is not accepted by its independent source."
      );
    }
  }
  for (const numericClaim of numericClaims) {
    if (!bindingsByClaimId.has(numericClaim.claimId)) {
      issue(
        issues,
        "missing-typed-claim-binding",
        `${casePath}.${numericClaim.claimId}`,
        "Visible numeric claim has no exact typed binding."
      );
    }
  }

  const sourceByResolvedClaimId = new Map<
    string,
    WorkedExampleTypedClaimSource
  >();
  for (const binding of bindings) {
    const claim = numericClaimsById.get(binding.claimId);
    const source = sourcesById.get(binding.sourceId);
    if (!claim || !source) continue;
    if (claim.displayUnit !== binding.expectedDisplayUnit) {
      issue(
        issues,
        "typed-claim-display-unit",
        `${casePath}.${claim.claimId}`,
        "Displayed unit disagrees with the explicit typed binding."
      );
    }
    if (claim.relation !== binding.expectedRelation) {
      issue(
        issues,
        "typed-claim-relation",
        `${casePath}.${claim.claimId}`,
        "Displayed relation disagrees with the explicit typed binding."
      );
    }
    const absoluteToleranceCeiling = Math.max(
      numericLiteralAbsoluteToleranceCeiling(claim.rawNumber),
      1e-12
    );
    const bindingEffectiveTolerance = Math.max(
      binding.absoluteTolerance,
      binding.relativeTolerance * Math.abs(source.value)
    );
    const sourceEffectiveTolerance = Math.max(
      source.absoluteTolerance,
      source.relativeTolerance * Math.abs(source.value)
    );
    if (bindingEffectiveTolerance > absoluteToleranceCeiling) {
      issue(
        issues,
        "typed-claim-tolerance-ceiling",
        `${casePath}.${claim.claimId}`,
        "Typed binding tolerance exceeds the independently derived literal-precision ceiling."
      );
    }
    if (sourceEffectiveTolerance > absoluteToleranceCeiling) {
      issue(
        issues,
        "typed-claim-source-tolerance-ceiling",
        `${casePath}.${claim.claimId}`,
        "Typed source tolerance exceeds the independently derived literal-precision ceiling."
      );
    }
    const tolerance = Math.min(
      Math.max(
        bindingEffectiveTolerance,
        sourceEffectiveTolerance,
        1e-12
      ),
      absoluteToleranceCeiling
    );
    if (exceedsNumericTolerance(
      claim.numericValue,
      source.value,
      tolerance
    )) {
      issue(
        issues,
        "typed-claim-value",
        `${casePath}.${claim.claimId}`,
        "Displayed value disagrees with its independently evaluated typed source."
      );
    }
    sourceByResolvedClaimId.set(claim.claimId, source);
  }

  for (const source of sources) {
    for (const claimId of source.claimIds) {
      const binding = bindingsByClaimId.get(claimId);
      if (!binding || binding.sourceId !== source.sourceId) {
        issue(
          issues,
          "typed-source-binding-disagreement",
          `${casePath}.${source.sourceId}.${claimId}`,
          "Evaluator-owned claim ID disagrees with the explicit binding registry."
        );
      }
    }
  }

  const resolvedSourceIds = new Set(
    Array.from(
      sourceByResolvedClaimId.values(),
      (source) => source.sourceId
    )
  );
  for (const [inputId, inputDefinition] of Object.entries(
    verificationCase.inputs
  )) {
    const inputSourceId = `input:${inputId}`;
    if (inputDefinition.displayedValueRequired !== false) {
      if (!resolvedSourceIds.has(inputSourceId)) {
        issue(
          issues,
          "missing-explicit-input-binding",
          `${casePath}.${inputSourceId}`,
          "Required named input has no explicit display occurrence binding."
        );
      }
      continue;
    }
    const hasReason = Boolean(inputDefinition.displayOmissionReason?.trim());
    if (inputDefinition.displayBindingMode === "implicit-coefficient") {
      if (Math.abs(inputDefinition.value) !== 1 || !hasReason) {
        issue(
          issues,
          "invalid-implicit-input-binding",
          `${casePath}.${inputSourceId}`,
          "Implicit coefficient omission requires a justified plus or minus one value."
        );
      }
    } else if (inputDefinition.displayBindingMode === "shared-equal-inputs") {
      const sharedBindingExists = bindings.some((binding) => {
        const source = sourcesById.get(binding.sourceId);
        return (
          source?.kind === "input"
          && source.dependencyIds.includes(inputSourceId)
          && source.dependencyIds.length > 1
        );
      });
      if (!hasReason || !sharedBindingExists) {
        issue(
          issues,
          "invalid-shared-input-binding",
          `${casePath}.${inputSourceId}`,
          "Shared-value omission requires one explicit grouped source with all named input dependencies."
        );
      }
    } else {
      issue(
        issues,
        "invalid-input-omission-mode",
        `${casePath}.${inputSourceId}`,
        "Omitted input requires an explicit supported binding mode."
      );
    }
  }

  const sourceDependsOn = (
    sourceId: string,
    dependencyId: string,
    seen = new Set<string>()
  ): boolean => {
    if (sourceId === dependencyId) return true;
    if (seen.has(sourceId)) return false;
    seen.add(sourceId);
    const source = sourcesById.get(sourceId);
    return source?.dependencyIds.some((candidateId) =>
      sourceDependsOn(candidateId, dependencyId, seen)
    ) ?? false;
  };
  const hasResultOutputOccurrence = bindings.some((binding) => {
    const claim = numericClaimsById.get(binding.claimId);
    return (
      claim?.field === "result"
      && verificationCase.assertions.some((assertion) =>
        sourceDependsOn(binding.sourceId, `output:${assertion.outputId}`)
      )
    );
  });
  for (const assertion of verificationCase.assertions) {
    const outputSourceId = `output:${assertion.outputId}`;
    const hasExplicitOutputOccurrence = bindings.some((binding) => {
      const claim = numericClaimsById.get(binding.claimId);
      return (
        (claim?.field !== "step" && claim?.field !== "result")
          ? false
          : sourceDependsOn(binding.sourceId, outputSourceId)
      );
    });
    if (!hasExplicitOutputOccurrence) {
      issue(
        issues,
        "missing-explicit-output-binding",
        `${casePath}.${outputSourceId}`,
        "Verified output has no explicit step or result occurrence binding or evaluated display transform."
      );
    }
  }
  if (!hasResultOutputOccurrence) {
    issue(
      issues,
      "missing-explicit-result-output-binding",
      casePath,
      "Worked example result has no explicit evaluated output occurrence binding."
    );
  }

  for (const source of sources) {
    if (
      source.claimIds.length > 0
      && !source.claimIds.some((claimId) =>
        bindingsByClaimId.get(claimId)?.sourceId === source.sourceId
      )
    ) {
      issue(
        issues,
        "orphan-required-typed-source",
        `${casePath}.${source.sourceId}`,
        "Evaluator-owned source has no exact display binding."
      );
    }
  }

  const claims = bindings.flatMap(
    (binding): WorkedExampleTypedDisplayClaim[] => {
      const source = sourcesById.get(binding.sourceId);
      if (!source || !numericClaimsById.has(binding.claimId)) return [];
      return [{
        claimId: binding.claimId,
        sourceId: source.sourceId,
        kind: source.kind,
        dependencyIds: source.dependencyIds,
        expectedValue: source.value,
        canonicalUnit: source.canonicalUnit,
        displayUnit: binding.expectedDisplayUnit,
        relation: binding.expectedRelation,
        absoluteTolerance: binding.absoluteTolerance,
        relativeTolerance: binding.relativeTolerance
      }];
    }
  );
  return { sources, claims, issues };
};

export const fingerprintWorkedExampleTypedDisplayClaims = (
  claims: readonly WorkedExampleTypedDisplayClaim[]
): string => `fnv1a32:${fnv1a32(JSON.stringify(claims))}`;

export const expandWorkedExampleVerificationInstances = (
  families: WorkedExampleFamilyRegistry,
  assignments: readonly QuantitativeLessonFormulaAssignment[]
): WorkedExampleVerificationInstance[] =>
  assignments.flatMap((assignment) => {
    const family = families[assignment.familyId];
    if (!family) return [];
    return family.cases.map((verificationCase) => {
      const workedExampleId = (
        `${assignment.lessonId}-EX${String(
          verificationCase.sourceExampleIndex
        ).padStart(2, "0")}`
      );
      return {
        id: workedExampleId,
        workedExampleId,
        lessonId: assignment.lessonId,
        familyId: assignment.familyId,
        caseId: verificationCase.id,
        oracleId: verificationCase.oracleId
      };
    });
  });

export const validateWorkedExampleVerification = (
  families: WorkedExampleFamilyRegistry,
  assignments: readonly QuantitativeLessonFormulaAssignment[]
): WorkedExampleVerificationIssue[] => {
  const issues: WorkedExampleVerificationIssue[] = [];
  const familyEntries = Object.entries(families);
  const allCases = familyEntries.flatMap(([, family]) => family.cases);
  const familyIds = familyEntries.map(([familyId]) => familyId);
  const caseIds = allCases.map((verificationCase) => verificationCase.id);
  const oracleIds = Object.keys(independentWorkedExampleOracles);

  if (familyEntries.length !== EXPECTED_WORKED_EXAMPLE_FAMILY_COUNT) {
    issue(
      issues,
      "family-count",
      "families",
      `Expected ${EXPECTED_WORKED_EXAMPLE_FAMILY_COUNT} families, found ${familyEntries.length}.`
    );
  }
  if (allCases.length !== EXPECTED_WORKED_EXAMPLE_CASE_COUNT) {
    issue(
      issues,
      "case-count",
      "families.cases",
      `Expected ${EXPECTED_WORKED_EXAMPLE_CASE_COUNT} cases, found ${allCases.length}.`
    );
  }
  const typedDisplayClaimCount = allCases.reduce(
    (total, verificationCase) =>
      total + verificationCase.displayTypedClaimCount,
    0
  );
  if (
    typedDisplayClaimCount
    !== EXPECTED_WORKED_EXAMPLE_TYPED_DISPLAY_CLAIM_COUNT
  ) {
    issue(
      issues,
      "typed-display-claim-count",
      "families.cases",
      (
        `Expected ${EXPECTED_WORKED_EXAMPLE_TYPED_DISPLAY_CLAIM_COUNT} `
        + `typed display claims, found ${typedDisplayClaimCount}.`
      )
    );
  }
  for (const duplicate of duplicateValues(caseIds)) {
    issue(issues, "duplicate-case", `cases.${duplicate}`, "Case ID is duplicated.");
  }
  for (const orphanOracle of oracleIds.filter(
    (oracleId) => !caseIds.includes(oracleId)
  )) {
    issue(
      issues,
      "orphan-oracle",
      `oracles.${orphanOracle}`,
      "Independent oracle has no exact worked-example case."
    );
  }

  for (const [registryKey, family] of familyEntries) {
    const familyPath = `families.${registryKey}`;
    if (
      family.familyId !== registryKey
      || !family.formulaSignature.trim()
      || family.cases.length !== 2
    ) {
      issue(
        issues,
        "family-identity",
        familyPath,
        "Family key, ID, signature and two-case shape must resolve exactly."
      );
    }
    for (const [caseIndex, verificationCase] of family.cases.entries()) {
      const expectedCaseId = (
        `${family.familyId}-CASE-${String(caseIndex + 1).padStart(2, "0")}`
      );
      const casePath = `${familyPath}.cases.${verificationCase.id}`;
      if (
        verificationCase.id !== expectedCaseId
        || verificationCase.familyId !== family.familyId
        || verificationCase.oracleId !== verificationCase.id
        || verificationCase.sourceExampleIndex !== caseIndex + 1
        || !(verificationCase.oracleId in independentWorkedExampleOracles)
      ) {
        issue(
          issues,
          "case-identity",
          casePath,
          "Case, family, source example and oracle IDs must resolve one-to-one."
        );
      }
      if (!/^fnv1a32:[0-9a-f]{8}$/u.test(verificationCase.displayFingerprint)) {
        issue(
          issues,
          "display-fingerprint-format",
          casePath,
          "Case requires a hard-coded FNV-1a display fingerprint."
        );
      }
      if (
        !Number.isInteger(verificationCase.displayNumericClaimCount)
        || verificationCase.displayNumericClaimCount <= 0
        || !/^fnv1a32:[0-9a-f]{8}$/u.test(
          verificationCase.displayNumericClaimsFingerprint
        )
      ) {
        issue(
          issues,
          "display-numeric-contract",
          casePath,
          "Case requires a positive numeric-claim count and hard-coded numeric-claim fingerprint."
        );
      }
      if (
        !Number.isInteger(verificationCase.displayTypedClaimCount)
        || verificationCase.displayTypedClaimCount <= 0
        || !/^fnv1a32:[0-9a-f]{8}$/u.test(
          verificationCase.displayTypedClaimsFingerprint
        )
      ) {
        issue(
          issues,
          "display-typed-claim-contract",
          casePath,
          "Case requires a positive typed-claim count and hard-coded typed-claim fingerprint."
        );
      }
      const inputEntries = Object.entries(verificationCase.inputs);
      if (inputEntries.length === 0) {
        issue(issues, "case-inputs", casePath, "Case requires structured inputs.");
      }
      for (const [inputName, currentInput] of inputEntries) {
        if (
          !inputName.trim()
          || !currentInput.unit.trim()
          || !Number.isFinite(currentInput.value)
          || !Number.isFinite(currentInput.minimum)
          || !Number.isFinite(currentInput.maximum)
        ) {
          issue(
            issues,
            "case-input-finite",
            `${casePath}.inputs.${inputName}`,
            "Input name, unit, value and bounds must be finite and explicit."
          );
        } else if (
          currentInput.maximum < currentInput.minimum
          || currentInput.value < currentInput.minimum
          || currentInput.value > currentInput.maximum
        ) {
          issue(
            issues,
            "case-input-bounds",
            `${casePath}.inputs.${inputName}`,
            "Input value must remain inside ordered declared bounds."
          );
        }
      }

      const assertionIds = verificationCase.assertions.map(
        (assertion) => assertion.outputId
      );
      if (assertionIds.length === 0) {
        issue(issues, "case-assertions", casePath, "Case requires output assertions.");
      }
      for (const duplicate of duplicateValues(assertionIds)) {
        issue(
          issues,
          "duplicate-assertion",
          `${casePath}.assertions.${duplicate}`,
          "Output assertion ID is duplicated."
        );
      }

      try {
        const oracleOutput = evaluateIndependentWorkedExampleOracle(
          verificationCase.oracleId,
          verificationCase.inputs
        );
        const oracleUnitContract: Readonly<Record<string, string>> = (
          independentWorkedExampleOracleUnitContracts[
            verificationCase.oracleId
          ]
        );
        const oracleOutputIds = Object.keys(oracleOutput).sort();
        const oracleUnitIds = Object.keys(oracleUnitContract).sort();
        const expectedOutputIds = [...assertionIds].sort();
        if (
          JSON.stringify(oracleOutputIds) !== JSON.stringify(expectedOutputIds)
          || JSON.stringify(oracleUnitIds) !== JSON.stringify(expectedOutputIds)
        ) {
          issue(
            issues,
            "case-output-keys",
            casePath,
            "Oracle value, unit and assertion output keys must match exactly."
          );
        }
        for (const assertion of verificationCase.assertions) {
          const assertionPath = `${casePath}.assertions.${assertion.outputId}`;
          if (
            !assertion.outputId.trim()
            || !assertion.canonicalUnit.trim()
            || !assertion.displayFragment.trim()
            || !Number.isFinite(assertion.expectedValue)
            || !Number.isFinite(assertion.absoluteTolerance)
            || !Number.isFinite(assertion.relativeTolerance)
            || assertion.absoluteTolerance < 0
            || assertion.relativeTolerance < 0
          ) {
            issue(
              issues,
              "assertion-metadata",
              assertionPath,
              "Assertion requires finite value and tolerances, unit, relation and display fragment."
            );
            continue;
          }
          const oracleValue = oracleOutput[assertion.outputId];
          if (!Number.isFinite(oracleValue)) {
            issue(
              issues,
              "orphan-assertion",
              assertionPath,
              "Assertion has no finite independent oracle output."
            );
            continue;
          }
          if (
            assertion.canonicalUnit
            !== oracleUnitContract[assertion.outputId]
          ) {
            issue(
              issues,
              "assertion-unit",
              assertionPath,
              "Assertion unit disagrees with the independent oracle unit contract."
            );
          }
          if (
            oracleValue !== 0
            && assertion.expectedValue !== 0
            && Math.sign(oracleValue) !== Math.sign(assertion.expectedValue)
          ) {
            issue(
              issues,
              "assertion-sign",
              assertionPath,
              "Expected output sign disagrees with the independent oracle."
            );
          }
          const tolerance = Math.max(
            assertion.absoluteTolerance,
            assertion.relativeTolerance * Math.abs(oracleValue)
          );
          if (exceedsNumericTolerance(
            assertion.expectedValue,
            oracleValue,
            tolerance
          )) {
            issue(
              issues,
              "assertion-magnitude",
              assertionPath,
              "Expected output magnitude disagrees with the independent oracle."
            );
          }
        }
      } catch (error) {
        issue(
          issues,
          "case-oracle-evaluation",
          casePath,
          error instanceof Error
            ? error.message
            : "Independent oracle evaluation failed."
        );
      }
    }
  }

  if (assignments.length !== EXPECTED_QUANTITATIVE_LESSON_COUNT) {
    issue(
      issues,
      "assignment-count",
      "assignments",
      `Expected ${EXPECTED_QUANTITATIVE_LESSON_COUNT} lessons, found ${assignments.length}.`
    );
  }
  for (const duplicate of duplicateValues(
    assignments.map((assignment) => assignment.lessonId)
  )) {
    issue(
      issues,
      "duplicate-assignment",
      `assignments.${duplicate}`,
      "Lesson assignment is duplicated."
    );
  }
  const assignedFamilyIds = new Set<string>();
  for (const assignment of assignments) {
    if (!/^EML-E[0-4]-D\d{2}-L\d{2}$/u.test(assignment.lessonId)) {
      issue(
        issues,
        "assignment-lesson-id",
        `assignments.${assignment.lessonId}`,
        "Lesson ID is not canonical."
      );
    }
    if (!families[assignment.familyId]) {
      issue(
        issues,
        "orphan-assignment",
        `assignments.${assignment.lessonId}`,
        "Lesson assignment references an unknown family."
      );
    } else {
      assignedFamilyIds.add(assignment.familyId);
    }
  }
  for (const familyId of familyIds) {
    if (!assignedFamilyIds.has(familyId)) {
      issue(
        issues,
        "orphan-family",
        `families.${familyId}`,
        "Formula family has no quantitative lesson assignment."
      );
    }
  }

  const instances = expandWorkedExampleVerificationInstances(
    families,
    assignments
  );
  if (instances.length !== EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT) {
    issue(
      issues,
      "instance-count",
      "instances",
      `Expected ${EXPECTED_WORKED_EXAMPLE_INSTANCE_COUNT} instances, found ${instances.length}.`
    );
  }
  for (const duplicate of duplicateValues(
    instances.map((verificationInstance) => verificationInstance.id)
  )) {
    issue(
      issues,
      "duplicate-instance",
      `instances.${duplicate}`,
      "Worked-example verification instance ID is duplicated."
    );
  }
  const instanceCountByLesson = new Map<string, number>();
  for (const verificationInstance of instances) {
    instanceCountByLesson.set(
      verificationInstance.lessonId,
      (instanceCountByLesson.get(verificationInstance.lessonId) ?? 0) + 1
    );
  }
  for (const assignment of assignments) {
    if (instanceCountByLesson.get(assignment.lessonId) !== 2) {
      issue(
        issues,
        "lesson-instance-count",
        `instances.${assignment.lessonId}`,
        "Every quantitative lesson must resolve exactly two worked examples."
      );
    }
  }

  return issues;
};

export const validateWorkedExampleDisplayBindings = (
  families: WorkedExampleFamilyRegistry,
  displayRegistry: WorkedExampleDisplayRegistry
): WorkedExampleVerificationIssue[] => {
  const issues: WorkedExampleVerificationIssue[] = [];
  const familyIds = Object.keys(families);
  for (const displayFamilyId of Object.keys(displayRegistry)) {
    if (!families[displayFamilyId]) {
      issue(
        issues,
        "orphan-display-family",
        `display.${displayFamilyId}`,
        "Displayed formula family has no independent case family."
      );
    }
  }
  for (const familyId of familyIds) {
    const family = families[familyId];
    const displayExamples = displayRegistry[familyId];
    if (!displayExamples || displayExamples.length !== 2) {
      issue(
        issues,
        "display-case-count",
        `display.${familyId}`,
        "Displayed family must provide exactly two worked examples."
      );
      continue;
    }
    for (const verificationCase of family.cases) {
      const displaySource = displayExamples[
        verificationCase.sourceExampleIndex - 1
      ];
      const casePath = `display.${familyId}.${verificationCase.id}`;
      if (!displaySource) {
        issue(
          issues,
          "missing-display-case",
          casePath,
          "Independent case has no displayed worked example."
        );
        continue;
      }
      if (
        fingerprintWorkedExampleDisplaySource(displaySource)
        !== verificationCase.displayFingerprint
      ) {
        issue(
          issues,
          "display-fingerprint",
          casePath,
          "Displayed problem, steps, result or independent check changed."
        );
      }
      const numericClaims = extractWorkedExampleNumericDisplayClaims(
        displaySource
      );
      if (
        numericClaims.length !== verificationCase.displayNumericClaimCount
        || fingerprintWorkedExampleNumericDisplayClaims(displaySource)
          !== verificationCase.displayNumericClaimsFingerprint
      ) {
        issue(
          issues,
          "display-numeric-claims",
          casePath,
          "Displayed numeric inputs, intermediates, conversions or results changed."
        );
      }
      if (
        new Set(numericClaims.map((claim) => claim.claimId)).size
        !== numericClaims.length
      ) {
        issue(
          issues,
          "display-numeric-claim-identity",
          casePath,
          "Every parsed numeric display claim must resolve exactly once."
        );
      }
      const typedResolution = resolveWorkedExampleTypedDisplayClaims(
        verificationCase,
        displaySource
      );
      issues.push(...typedResolution.issues);
      if (
        typedResolution.claims.length
          !== verificationCase.displayTypedClaimCount
        || fingerprintWorkedExampleTypedDisplayClaims(typedResolution.claims)
          !== verificationCase.displayTypedClaimsFingerprint
      ) {
        issue(
          issues,
          "display-typed-claims",
          casePath,
          "Typed claim identities, evaluators, values, units, relations or tolerances changed."
        );
      }
      const assertedDisplayText = [
        ...displaySource.steps,
        displaySource.result
      ].join("\n");
      for (const assertion of verificationCase.assertions) {
        if (!assertedDisplayText.includes(assertion.displayFragment)) {
          issue(
            issues,
            "display-assertion-fragment",
            `${casePath}.${assertion.outputId}`,
            "Output assertion fragment is absent from displayed steps and result."
          );
        }
      }
    }
  }
  return issues;
};

export const validateWorkedExampleProductionBindings = (
  families: WorkedExampleFamilyRegistry,
  instances: readonly WorkedExampleVerificationInstance[],
  productionBindings: readonly WorkedExampleProductionBinding[]
): WorkedExampleVerificationIssue[] => {
  const issues: WorkedExampleVerificationIssue[] = [];
  const casesById = new Map(
    Object.values(families).flatMap((family) =>
      family.cases.map((verificationCase) => [
        verificationCase.id,
        verificationCase
      ] as const)
    )
  );
  const bindingsById = new Map(
    productionBindings.map((binding) => [binding.id, binding])
  );
  for (const duplicate of duplicateValues(
    productionBindings.map((binding) => binding.id)
  )) {
    issue(
      issues,
      "duplicate-production-binding",
      `production.${duplicate}`,
      "Production worked-example binding ID is duplicated."
    );
  }
  for (const productionBinding of productionBindings) {
    if (!instances.some((instance) => instance.id === productionBinding.id)) {
      issue(
        issues,
        "orphan-production-binding",
        `production.${productionBinding.id}`,
        "Production worked example has no verifier instance."
      );
    }
  }
  for (const instance of instances) {
    const path = `production.${instance.id}`;
    const productionBinding = bindingsById.get(instance.id);
    const verificationCase = casesById.get(instance.caseId);
    if (!productionBinding || !verificationCase) {
      issue(
        issues,
        "missing-production-binding",
        path,
        "Verifier instance requires one production worked-example binding."
      );
      continue;
    }
    if (productionBinding.verificationCaseId !== instance.caseId) {
      issue(
        issues,
        "production-case-id",
        path,
        "Production verification case ID disagrees with the verifier instance."
      );
    }
    const productionOutputIds = productionBinding.verificationOutputs
      .map((output) => output.outputId);
    const assertionIds = verificationCase.assertions
      .map((assertion) => assertion.outputId);
    if (
      duplicateValues(productionOutputIds).length > 0
      || JSON.stringify([...productionOutputIds].sort())
        !== JSON.stringify([...assertionIds].sort())
    ) {
      issue(
        issues,
        "production-output-keys",
        path,
        "Production output IDs must match verifier assertions exactly once."
      );
    }
    const outputById = new Map(
      productionBinding.verificationOutputs.map((output) => [
        output.outputId,
        output
      ])
    );
    for (const assertion of verificationCase.assertions) {
      const output = outputById.get(assertion.outputId);
      const outputPath = `${path}.${assertion.outputId}`;
      if (!output || !Number.isFinite(output.value)) {
        issue(
          issues,
          "production-output-missing",
          outputPath,
          "Production named output is missing or nonfinite."
        );
        continue;
      }
      if (output.canonicalUnit !== assertion.canonicalUnit) {
        issue(
          issues,
          "production-output-unit",
          outputPath,
          "Production named output unit disagrees with the verified case."
        );
      }
      const tolerance = Math.max(
        assertion.absoluteTolerance,
        assertion.relativeTolerance * Math.abs(assertion.expectedValue)
      );
      if (exceedsNumericTolerance(
        output.value,
        assertion.expectedValue,
        tolerance
      )) {
        issue(
          issues,
          "production-output-value",
          outputPath,
          "Production named output value disagrees with the verified case."
        );
      }
    }
  }
  return issues;
};

const stableSerialiseVerification = (
  families: WorkedExampleFamilyRegistry,
  assignments: readonly QuantitativeLessonFormulaAssignment[]
): string => JSON.stringify({
  families: Object.keys(families).sort().map((familyId) => ({
    familyId,
    formulaSignature: families[familyId].formulaSignature,
    cases: families[familyId].cases.map((verificationCase) => ({
      ...verificationCase,
      inputs: Object.keys(verificationCase.inputs).sort().map((inputName) => ({
        inputName,
        ...verificationCase.inputs[inputName]
      })),
      assertions: [...verificationCase.assertions].sort((left, right) =>
        left.outputId.localeCompare(right.outputId)
      )
    }))
  })),
  assignments: [...assignments].sort((left, right) =>
    left.lessonId.localeCompare(right.lessonId)
  )
});

export const buildWorkedExampleVerificationQualityManifest = (
  families: WorkedExampleFamilyRegistry,
  assignments: readonly QuantitativeLessonFormulaAssignment[]
): WorkedExampleVerificationQualityManifest => {
  const issues = validateWorkedExampleVerification(families, assignments);
  const allCases = Object.values(families).flatMap((family) => family.cases);
  const instances = expandWorkedExampleVerificationInstances(
    families,
    assignments
  );
  return {
    schemaVersion: "3",
    fingerprint: (
      `fnv1a32:${fnv1a32(stableSerialiseVerification(families, assignments))}`
    ),
    status: issues.length === 0 ? "pass" : "fail",
    familyCount: Object.keys(families).length,
    caseCount: allCases.length,
    outputAssertionCount: allCases.reduce(
      (total, verificationCase) =>
        total + verificationCase.assertions.length,
      0
    ),
    typedDisplayClaimCount: allCases.reduce(
      (total, verificationCase) =>
        total + verificationCase.displayTypedClaimCount,
      0
    ),
    quantitativeLessonCount: assignments.length,
    instanceCount: instances.length,
    issueCount: issues.length
  };
};
