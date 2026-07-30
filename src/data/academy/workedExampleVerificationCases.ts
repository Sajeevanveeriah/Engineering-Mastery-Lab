import {
  buildWorkedExampleVerificationQualityManifest,
  expandWorkedExampleVerificationInstances,
  type IndependentWorkedExampleCase,
  type QuantitativeLessonFormulaAssignment,
  type WorkedExampleAssertionRelation,
  type WorkedExampleFamilyRegistry,
  type WorkedExampleFamilyVerification,
  type WorkedExampleInput,
  type WorkedExampleOracleId,
  type WorkedExampleOutputAssertion,
  type WorkedExampleTypedClaimBinding
} from "../../lib/academy/workedExampleVerification";

type CaseSeed = Omit<
  IndependentWorkedExampleCase,
  | "id"
  | "familyId"
  | "sourceExampleIndex"
  | "oracleId"
  | "displayNumericClaimCount"
  | "displayNumericClaimsFingerprint"
  | "displayTypedClaimCount"
  | "displayTypedClaimsFingerprint"
  | "displayTypedClaimBindings"
  | "displayUnitImplicitClaimIds"
>;

const input = (
  value: number,
  unit: string,
  minimum = -1e15,
  maximum = 1e15
): WorkedExampleInput => ({ value, unit, minimum, maximum });

const assertion = (
  outputId: string,
  expectedValue: number,
  canonicalUnit: string,
  displayFragment: string,
  absoluteTolerance = 1e-9,
  relativeTolerance = 1e-9,
  relation: WorkedExampleAssertionRelation = "equals"
): WorkedExampleOutputAssertion => ({
  outputId,
  expectedValue,
  canonicalUnit,
  relation,
  absoluteTolerance,
  relativeTolerance,
  displayFragment
});

const workedExampleNumericDisplayContracts = {
  "sum-CASE-01": { count: 16, fingerprint: "fnv1a32:0793f457", typedFingerprint: "fnv1a32:f558bb21" },
  "sum-CASE-02": { count: 18, fingerprint: "fnv1a32:6acc299e", typedFingerprint: "fnv1a32:8fa3f72d" },
  "ratio-CASE-01": { count: 8, fingerprint: "fnv1a32:105c4da4", typedFingerprint: "fnv1a32:9174e4c4" },
  "ratio-CASE-02": { count: 10, fingerprint: "fnv1a32:7fc1d105", typedFingerprint: "fnv1a32:d062bc98" },
  "linear-CASE-01": { count: 13, fingerprint: "fnv1a32:ed2a1374", typedFingerprint: "fnv1a32:b33b4a9e" },
  "linear-CASE-02": { count: 13, fingerprint: "fnv1a32:70b343df", typedFingerprint: "fnv1a32:a6553521" },
  "vector-CASE-01": { count: 16, fingerprint: "fnv1a32:d77a4c65", typedFingerprint: "fnv1a32:f549bd28" },
  "vector-CASE-02": { count: 13, fingerprint: "fnv1a32:1044a09c", typedFingerprint: "fnv1a32:565113ea" },
  "eigen-CASE-01": { count: 15, fingerprint: "fnv1a32:796401df", typedFingerprint: "fnv1a32:75d18b64" },
  "eigen-CASE-02": { count: 11, fingerprint: "fnv1a32:10e6f243", typedFingerprint: "fnv1a32:cb605b25" },
  "inverseDerivative-CASE-01": { count: 7, fingerprint: "fnv1a32:1c69edc8", typedFingerprint: "fnv1a32:dd64a5dc" },
  "inverseDerivative-CASE-02": { count: 13, fingerprint: "fnv1a32:28f53b3e", typedFingerprint: "fnv1a32:d9a7edc5" },
  "derivative-CASE-01": { count: 10, fingerprint: "fnv1a32:c0c6812b", typedFingerprint: "fnv1a32:74c60b20" },
  "derivative-CASE-02": { count: 10, fingerprint: "fnv1a32:d4caa4e5", typedFingerprint: "fnv1a32:245402a4" },
  "integral-CASE-01": { count: 8, fingerprint: "fnv1a32:e8f60dc9", typedFingerprint: "fnv1a32:a4114e91" },
  "integral-CASE-02": { count: 8, fingerprint: "fnv1a32:6ec729cb", typedFingerprint: "fnv1a32:b064d9df" },
  "force-CASE-01": { count: 12, fingerprint: "fnv1a32:814cdde0", typedFingerprint: "fnv1a32:e80e9a9a" },
  "force-CASE-02": { count: 10, fingerprint: "fnv1a32:61b53b60", typedFingerprint: "fnv1a32:416ee816" },
  "stress-CASE-01": { count: 14, fingerprint: "fnv1a32:d3d3c051", typedFingerprint: "fnv1a32:2a7333b0" },
  "stress-CASE-02": { count: 16, fingerprint: "fnv1a32:365197d6", typedFingerprint: "fnv1a32:f47e60c4" },
  "power-CASE-01": { count: 8, fingerprint: "fnv1a32:20a48a96", typedFingerprint: "fnv1a32:e9673d52" },
  "power-CASE-02": { count: 8, fingerprint: "fnv1a32:29fbd873", typedFingerprint: "fnv1a32:ca1a1950" },
  "ohm-CASE-01": { count: 10, fingerprint: "fnv1a32:27a9ade3", typedFingerprint: "fnv1a32:d1497fcf" },
  "ohm-CASE-02": { count: 8, fingerprint: "fnv1a32:1d3def46", typedFingerprint: "fnv1a32:f59acc3d" },
  "timing-CASE-01": { count: 12, fingerprint: "fnv1a32:d14424dc", typedFingerprint: "fnv1a32:bc92f1c5" },
  "timing-CASE-02": { count: 9, fingerprint: "fnv1a32:cf86d9f7", typedFingerprint: "fnv1a32:2c3e2ef8" },
  "sampling-CASE-01": { count: 6, fingerprint: "fnv1a32:942ab79e", typedFingerprint: "fnv1a32:482fad75" },
  "sampling-CASE-02": { count: 7, fingerprint: "fnv1a32:2646d19f", typedFingerprint: "fnv1a32:6b10673b" },
  "control-CASE-01": { count: 12, fingerprint: "fnv1a32:24739bf6", typedFingerprint: "fnv1a32:2fb0cfc3" },
  "control-CASE-02": { count: 11, fingerprint: "fnv1a32:f2969ec4", typedFingerprint: "fnv1a32:ee1c9d25" },
  "robot-CASE-01": { count: 4, fingerprint: "fnv1a32:6aecbfef", typedFingerprint: "fnv1a32:4c4a3553" },
  "robot-CASE-02": { count: 15, fingerprint: "fnv1a32:a977cec3", typedFingerprint: "fnv1a32:77121c9f" },
  "estimate-CASE-01": { count: 15, fingerprint: "fnv1a32:b078b166", typedFingerprint: "fnv1a32:199a8432" },
  "estimate-CASE-02": { count: 8, fingerprint: "fnv1a32:07cc6c7b", typedFingerprint: "fnv1a32:de026536" },
  "pinhole-CASE-01": { count: 12, fingerprint: "fnv1a32:23c0c474", typedFingerprint: "fnv1a32:94de6a5a" },
  "pinhole-CASE-02": { count: 13, fingerprint: "fnv1a32:9e23595b", typedFingerprint: "fnv1a32:b6745a09" },
  "metric-CASE-01": { count: 13, fingerprint: "fnv1a32:d15df1a4", typedFingerprint: "fnv1a32:d5855fe7" },
  "metric-CASE-02": { count: 13, fingerprint: "fnv1a32:3d2f1f54", typedFingerprint: "fnv1a32:4c469f0e" },
  "uncertainty-CASE-01": { count: 14, fingerprint: "fnv1a32:5ed070fd", typedFingerprint: "fnv1a32:464a997c" },
  "uncertainty-CASE-02": { count: 9, fingerprint: "fnv1a32:5183cc79", typedFingerprint: "fnv1a32:ad9f8707" },
  "partialSensitivity-CASE-01": { count: 8, fingerprint: "fnv1a32:8bfd5b90", typedFingerprint: "fnv1a32:2277a12b" },
  "partialSensitivity-CASE-02": { count: 8, fingerprint: "fnv1a32:7bbb637f", typedFingerprint: "fnv1a32:197fbb6a" },
  "firstOrderStep-CASE-01": { count: 11, fingerprint: "fnv1a32:e820dcb3", typedFingerprint: "fnv1a32:ca563ddf" },
  "firstOrderStep-CASE-02": { count: 12, fingerprint: "fnv1a32:ba87473f", typedFingerprint: "fnv1a32:404a7fc0" },
  "mean-CASE-01": { count: 13, fingerprint: "fnv1a32:e49c4fdd", typedFingerprint: "fnv1a32:40a42692" },
  "mean-CASE-02": { count: 16, fingerprint: "fnv1a32:c223b511", typedFingerprint: "fnv1a32:fe23e728" },
  "oscillation-CASE-01": { count: 11, fingerprint: "fnv1a32:a47186af", typedFingerprint: "fnv1a32:d8ed1201" },
  "oscillation-CASE-02": { count: 8, fingerprint: "fnv1a32:e7a01a70", typedFingerprint: "fnv1a32:e9e3b6a9" },
  "coulomb-CASE-01": { count: 8, fingerprint: "fnv1a32:04b0f545", typedFingerprint: "fnv1a32:54638052" },
  "coulomb-CASE-02": { count: 9, fingerprint: "fnv1a32:56fceb8d", typedFingerprint: "fnv1a32:bede9827" },
  "heatConduction-CASE-01": { count: 14, fingerprint: "fnv1a32:06ed389f", typedFingerprint: "fnv1a32:9ba533e2" },
  "heatConduction-CASE-02": { count: 14, fingerprint: "fnv1a32:d601a64c", typedFingerprint: "fnv1a32:6e2771f0" },
  "spring-CASE-01": { count: 8, fingerprint: "fnv1a32:67900c41", typedFingerprint: "fnv1a32:e6045bac" },
  "spring-CASE-02": { count: 8, fingerprint: "fnv1a32:e290262f", typedFingerprint: "fnv1a32:0b640e18" },
  "machiningSpeed-CASE-01": { count: 10, fingerprint: "fnv1a32:b9af7a55", typedFingerprint: "fnv1a32:0d14a7ce" },
  "machiningSpeed-CASE-02": { count: 9, fingerprint: "fnv1a32:adfef16b", typedFingerprint: "fnv1a32:8f662902" },
  "rcCutoff-CASE-01": { count: 12, fingerprint: "fnv1a32:270d04fd", typedFingerprint: "fnv1a32:85840a3b" },
  "rcCutoff-CASE-02": { count: 9, fingerprint: "fnv1a32:58e4118f", typedFingerprint: "fnv1a32:54ebf2ce" },
  "adcResolution-CASE-01": { count: 9, fingerprint: "fnv1a32:551e3824", typedFingerprint: "fnv1a32:2a76c3b1" },
  "adcResolution-CASE-02": { count: 9, fingerprint: "fnv1a32:2140398c", typedFingerprint: "fnv1a32:a1b68530" },
  "pwmDuty-CASE-01": { count: 9, fingerprint: "fnv1a32:a8a65d35", typedFingerprint: "fnv1a32:fe744682" },
  "pwmDuty-CASE-02": { count: 9, fingerprint: "fnv1a32:92f7831f", typedFingerprint: "fnv1a32:09bd47a3" },
  "fourier-CASE-01": { count: 13, fingerprint: "fnv1a32:fe62aa32", typedFingerprint: "fnv1a32:9cc82f79" },
  "fourier-CASE-02": { count: 10, fingerprint: "fnv1a32:38d78204", typedFingerprint: "fnv1a32:f8ec7e0e" },
  "stateSpace-CASE-01": { count: 13, fingerprint: "fnv1a32:23f2b278", typedFingerprint: "fnv1a32:ef7e63f8" },
  "stateSpace-CASE-02": { count: 7, fingerprint: "fnv1a32:51326a09", typedFingerprint: "fnv1a32:8fb893e7" },
  "rigidTransform-CASE-01": { count: 13, fingerprint: "fnv1a32:0501339f", typedFingerprint: "fnv1a32:b9dab197" },
  "rigidTransform-CASE-02": { count: 13, fingerprint: "fnv1a32:c64c232e", typedFingerprint: "fnv1a32:2dd8a70a" },
  "jacobian-CASE-01": { count: 8, fingerprint: "fnv1a32:1ab44648", typedFingerprint: "fnv1a32:cbb99b74" },
  "jacobian-CASE-02": { count: 5, fingerprint: "fnv1a32:93a5904d", typedFingerprint: "fnv1a32:6aceb189" },
  "inertia-CASE-01": { count: 11, fingerprint: "fnv1a32:fca9c9a1", typedFingerprint: "fnv1a32:8e72ee8e" },
  "inertia-CASE-02": { count: 13, fingerprint: "fnv1a32:1e0d8ab8", typedFingerprint: "fnv1a32:aa4e8f28" },
  "bayes-CASE-01": { count: 18, fingerprint: "fnv1a32:f90ee7ea", typedFingerprint: "fnv1a32:934a468b" },
  "bayes-CASE-02": { count: 12, fingerprint: "fnv1a32:1f3355dc", typedFingerprint: "fnv1a32:2352b50e" },
  "pathCost-CASE-01": { count: 8, fingerprint: "fnv1a32:6e538b05", typedFingerprint: "fnv1a32:48ed37d9" },
  "pathCost-CASE-02": { count: 5, fingerprint: "fnv1a32:ec01a1e5", typedFingerprint: "fnv1a32:1c942a5c" },
  "neuron-CASE-01": { count: 15, fingerprint: "fnv1a32:57edab3f", typedFingerprint: "fnv1a32:8559ec8e" },
  "neuron-CASE-02": { count: 14, fingerprint: "fnv1a32:8d42a3f7", typedFingerprint: "fnv1a32:c6d82e47" },
  "gradientDescent-CASE-01": { count: 8, fingerprint: "fnv1a32:2089816d", typedFingerprint: "fnv1a32:86dfa790" },
  "gradientDescent-CASE-02": { count: 8, fingerprint: "fnv1a32:d8db19a1", typedFingerprint: "fnv1a32:e0d77cb9" },
  "compression-CASE-01": { count: 5, fingerprint: "fnv1a32:2c83aced", typedFingerprint: "fnv1a32:afc2316d" },
  "compression-CASE-02": { count: 8, fingerprint: "fnv1a32:1a5db43c", typedFingerprint: "fnv1a32:671d8c9e" },
  "tradeScore-CASE-01": { count: 13, fingerprint: "fnv1a32:f3c1ff52", typedFingerprint: "fnv1a32:e2f5890b" },
  "tradeScore-CASE-02": { count: 17, fingerprint: "fnv1a32:215b5f89", typedFingerprint: "fnv1a32:a16606fb" },
  "riskScore-CASE-01": { count: 7, fingerprint: "fnv1a32:df785497", typedFingerprint: "fnv1a32:cc561660" },
  "riskScore-CASE-02": { count: 5, fingerprint: "fnv1a32:e4e27c86", typedFingerprint: "fnv1a32:83798e7b" },
  "complexMagnitude-CASE-01": { count: 10, fingerprint: "fnv1a32:41553116", typedFingerprint: "fnv1a32:082d8b11" },
  "complexMagnitude-CASE-02": { count: 11, fingerprint: "fnv1a32:45e98bbf", typedFingerprint: "fnv1a32:6b091582" },
  "toleranceStack-CASE-01": { count: 8, fingerprint: "fnv1a32:49da5628", typedFingerprint: "fnv1a32:420d1a64" },
  "toleranceStack-CASE-02": { count: 5, fingerprint: "fnv1a32:ccca39ab", typedFingerprint: "fnv1a32:e77e4762" },
  "probability-CASE-01": { count: 7, fingerprint: "fnv1a32:008f8291", typedFingerprint: "fnv1a32:3c416a9a" },
  "probability-CASE-02": { count: 6, fingerprint: "fnv1a32:fdafa036", typedFingerprint: "fnv1a32:46133935" },
  "featureMatchRatio-CASE-01": { count: 5, fingerprint: "fnv1a32:de14794b", typedFingerprint: "fnv1a32:6133d6b6" },
  "featureMatchRatio-CASE-02": { count: 8, fingerprint: "fnv1a32:d64963bd", typedFingerprint: "fnv1a32:f5136f60" },
  "transferMagnitude-CASE-01": { count: 8, fingerprint: "fnv1a32:90b29619", typedFingerprint: "fnv1a32:07acab83" },
  "transferMagnitude-CASE-02": { count: 5, fingerprint: "fnv1a32:4a2edc43", typedFingerprint: "fnv1a32:6873b5a0" },
  "pid-CASE-01": { count: 17, fingerprint: "fnv1a32:1a57bc4f", typedFingerprint: "fnv1a32:4f1edde4" },
  "pid-CASE-02": { count: 15, fingerprint: "fnv1a32:303967c6", typedFingerprint: "fnv1a32:5f69408e" },
  "reliability-CASE-01": { count: 7, fingerprint: "fnv1a32:204bb7c5", typedFingerprint: "fnv1a32:0b3cad6f" },
  "reliability-CASE-02": { count: 8, fingerprint: "fnv1a32:8b5949ba", typedFingerprint: "fnv1a32:1640d848" },
  "diodeShockley-CASE-01": { count: 12, fingerprint: "fnv1a32:e1159f2c", typedFingerprint: "fnv1a32:47269131" },
  "diodeShockley-CASE-02": { count: 8, fingerprint: "fnv1a32:da0fd739", typedFingerprint: "fnv1a32:0b4155e5" },
  "kalmanUpdate-CASE-01": { count: 15, fingerprint: "fnv1a32:d2876484", typedFingerprint: "fnv1a32:a75081da" },
  "kalmanUpdate-CASE-02": { count: 14, fingerprint: "fnv1a32:be4ccc81", typedFingerprint: "fnv1a32:aead8c57" },
  "extendedKalmanUpdate-CASE-01": { count: 26, fingerprint: "fnv1a32:f3d30df5", typedFingerprint: "fnv1a32:913927cf" },
  "extendedKalmanUpdate-CASE-02": { count: 20, fingerprint: "fnv1a32:a8880739", typedFingerprint: "fnv1a32:affd3530" }
} satisfies Record<
  WorkedExampleOracleId,
  { count: number; fingerprint: string; typedFingerprint: string }
>;

const workedExampleUnitImplicitClaimIds = {
  "sum-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003", "CHECK-NUMERIC-004", "CHECK-NUMERIC-005", "CHECK-NUMERIC-006"],
  "sum-CASE-02": ["STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-01-NUMERIC-003", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002"],
  "ratio-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-002"],
  "ratio-CASE-02": ["PROBLEM-NUMERIC-001", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "linear-CASE-01": [],
  "linear-CASE-02": [],
  "vector-CASE-01": ["STEP-01-NUMERIC-002", "STEP-01-NUMERIC-004", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "vector-CASE-02": ["STEP-02-NUMERIC-002", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-006", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-004"],
  "eigen-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "eigen-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-03-NUMERIC-001", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "inverseDerivative-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-01-NUMERIC-001", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "inverseDerivative-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "STEP-01-NUMERIC-001", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "RESULT-NUMERIC-002", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003", "CHECK-NUMERIC-004", "CHECK-NUMERIC-005"],
  "derivative-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-01-NUMERIC-001", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002"],
  "derivative-CASE-02": [],
  "integral-CASE-01": [],
  "integral-CASE-02": ["CHECK-NUMERIC-001"],
  "force-CASE-01": ["PROBLEM-NUMERIC-003", "STEP-01-NUMERIC-003", "STEP-03-NUMERIC-001", "CHECK-NUMERIC-004"],
  "force-CASE-02": ["RESULT-NUMERIC-002", "CHECK-NUMERIC-003"],
  "stress-CASE-01": ["PROBLEM-NUMERIC-003", "STEP-01-NUMERIC-002", "STEP-01-NUMERIC-004", "STEP-02-NUMERIC-003", "CHECK-NUMERIC-002"],
  "stress-CASE-02": ["STEP-01-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-003"],
  "power-CASE-01": [],
  "power-CASE-02": [],
  "ohm-CASE-01": ["STEP-01-NUMERIC-002", "STEP-02-NUMERIC-001", "CHECK-NUMERIC-003"],
  "ohm-CASE-02": ["PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-002", "CHECK-NUMERIC-001"],
  "timing-CASE-01": ["STEP-02-NUMERIC-001"],
  "timing-CASE-02": ["PROBLEM-NUMERIC-002", "STEP-01-NUMERIC-001"],
  "sampling-CASE-01": ["STEP-01-NUMERIC-001"],
  "sampling-CASE-02": ["STEP-01-NUMERIC-001", "STEP-02-NUMERIC-002"],
  "control-CASE-01": ["STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "control-CASE-02": ["STEP-03-NUMERIC-001"],
  "robot-CASE-01": [],
  "robot-CASE-02": ["STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-01-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "CHECK-NUMERIC-001", "CHECK-NUMERIC-003"],
  "estimate-CASE-01": ["PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-01-NUMERIC-003", "STEP-01-NUMERIC-004", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-03-NUMERIC-002"],
  "estimate-CASE-02": ["STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-03-NUMERIC-001"],
  "pinhole-CASE-01": ["STEP-01-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003", "CHECK-NUMERIC-004"],
  "pinhole-CASE-02": ["CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "metric-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-01-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003", "CHECK-NUMERIC-004"],
  "metric-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-01-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-03-NUMERIC-001", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "uncertainty-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003", "CHECK-NUMERIC-004", "CHECK-NUMERIC-005", "CHECK-NUMERIC-006"],
  "uncertainty-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001"],
  "partialSensitivity-CASE-01": [],
  "partialSensitivity-CASE-02": [],
  "firstOrderStep-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002"],
  "firstOrderStep-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002"],
  "mean-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-002"],
  "mean-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "oscillation-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "oscillation-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-03-NUMERIC-001"],
  "coulomb-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005"],
  "coulomb-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005"],
  "heatConduction-CASE-01": ["PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004"],
  "heatConduction-CASE-02": ["PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004"],
  "spring-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002"],
  "spring-CASE-02": [],
  "machiningSpeed-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "machiningSpeed-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "CHECK-NUMERIC-001", "CHECK-NUMERIC-003"],
  "rcCutoff-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "rcCutoff-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004"],
  "adcResolution-CASE-01": ["PROBLEM-NUMERIC-001", "CHECK-NUMERIC-002"],
  "adcResolution-CASE-02": ["PROBLEM-NUMERIC-001", "CHECK-NUMERIC-002"],
  "pwmDuty-CASE-01": ["RESULT-NUMERIC-001"],
  "pwmDuty-CASE-02": ["STEP-01-NUMERIC-001", "RESULT-NUMERIC-001"],
  "fourier-CASE-01": ["STEP-01-NUMERIC-001", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "fourier-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003"],
  "stateSpace-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-002"],
  "stateSpace-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003"],
  "rigidTransform-CASE-01": ["PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "rigidTransform-CASE-02": ["PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "jacobian-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002"],
  "jacobian-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002"],
  "inertia-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "RESULT-NUMERIC-002", "CHECK-NUMERIC-003"],
  "inertia-CASE-02": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "RESULT-NUMERIC-002", "CHECK-NUMERIC-002"],
  "bayes-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-02-NUMERIC-006", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003", "CHECK-NUMERIC-004", "CHECK-NUMERIC-005", "CHECK-NUMERIC-006"],
  "bayes-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-02-NUMERIC-006", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "RESULT-NUMERIC-001"],
  "pathCost-CASE-01": [],
  "pathCost-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001"],
  "neuron-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "PROBLEM-NUMERIC-005", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "STEP-03-NUMERIC-003", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001"],
  "neuron-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "PROBLEM-NUMERIC-005", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "STEP-03-NUMERIC-003", "RESULT-NUMERIC-001"],
  "gradientDescent-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-03-NUMERIC-001", "RESULT-NUMERIC-001"],
  "gradientDescent-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-03-NUMERIC-001", "RESULT-NUMERIC-001"],
  "compression-CASE-01": ["RESULT-NUMERIC-001"],
  "compression-CASE-02": ["RESULT-NUMERIC-001", "CHECK-NUMERIC-002"],
  "tradeScore-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "tradeScore-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "PROBLEM-NUMERIC-005", "PROBLEM-NUMERIC-006", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-02-NUMERIC-006", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "STEP-03-NUMERIC-003", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001"],
  "riskScore-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "riskScore-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001"],
  "complexMagnitude-CASE-01": ["PROBLEM-NUMERIC-001", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "complexMagnitude-CASE-02": ["PROBLEM-NUMERIC-001", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "toleranceStack-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002"],
  "toleranceStack-CASE-02": ["STEP-02-NUMERIC-001"],
  "probability-CASE-01": ["STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-003"],
  "probability-CASE-02": ["PROBLEM-NUMERIC-001", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-002"],
  "featureMatchRatio-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001"],
  "featureMatchRatio-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "transferMagnitude-CASE-01": ["RESULT-NUMERIC-001", "CHECK-NUMERIC-001"],
  "transferMagnitude-CASE-02": ["RESULT-NUMERIC-001"],
  "pid-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "PROBLEM-NUMERIC-005", "PROBLEM-NUMERIC-006", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-02-NUMERIC-006", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "STEP-03-NUMERIC-003", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001"],
  "pid-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-004", "PROBLEM-NUMERIC-005", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002"],
  "reliability-CASE-01": ["PROBLEM-NUMERIC-001", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001", "CHECK-NUMERIC-002", "CHECK-NUMERIC-003"],
  "reliability-CASE-02": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-002", "PROBLEM-NUMERIC-003", "STEP-01-NUMERIC-001", "STEP-01-NUMERIC-002", "STEP-02-NUMERIC-001", "RESULT-NUMERIC-001", "CHECK-NUMERIC-001"],
  "diodeShockley-CASE-01": ["PROBLEM-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-005"],
  "diodeShockley-CASE-02": ["STEP-02-NUMERIC-003", "STEP-02-NUMERIC-005"],
  "kalmanUpdate-CASE-01": ["PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-006", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-03-NUMERIC-001", "RESULT-NUMERIC-003"],
  "kalmanUpdate-CASE-02": ["PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-006", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "RESULT-NUMERIC-003"],
  "extendedKalmanUpdate-CASE-01": ["PROBLEM-NUMERIC-001", "PROBLEM-NUMERIC-004", "PROBLEM-NUMERIC-006", "PROBLEM-NUMERIC-008", "STEP-02-NUMERIC-001", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-02-NUMERIC-006", "STEP-02-NUMERIC-007", "STEP-02-NUMERIC-009", "STEP-03-NUMERIC-001", "STEP-03-NUMERIC-003", "CHECK-NUMERIC-003", "CHECK-NUMERIC-005"],
  "extendedKalmanUpdate-CASE-02": ["PROBLEM-NUMERIC-003", "PROBLEM-NUMERIC-005", "PROBLEM-NUMERIC-007", "STEP-02-NUMERIC-002", "STEP-02-NUMERIC-003", "STEP-02-NUMERIC-004", "STEP-02-NUMERIC-005", "STEP-02-NUMERIC-007", "STEP-02-NUMERIC-008", "STEP-03-NUMERIC-002", "CHECK-NUMERIC-002"],
} satisfies Record<WorkedExampleOracleId, readonly string[]>;

const workedExampleTypedClaimBindings = {
  "sum-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:d", expectedDisplayUnit: "min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:d", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:totalMinutes", expectedDisplayUnit: "min", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:c", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:b", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:d", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-005", sourceId: "intermediate:paired-subtotal", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-006", sourceId: "input:c", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-007", sourceId: "output:totalMinutes", expectedDisplayUnit: "min", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "sum-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-004", sourceId: "output:totalSeconds", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "constant:seconds-per-minute", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:one-minute", expectedDisplayUnit: "min", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "output:totalSeconds", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:seconds-per-minute", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-003", sourceId: "output:totalMinutes", expectedDisplayUnit: "min", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:totalSeconds", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:totalMinutes", expectedDisplayUnit: "min", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "conversion:a-minutes", expectedDisplayUnit: "min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "conversion:b-minutes", expectedDisplayUnit: "min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "conversion:c-minutes", expectedDisplayUnit: "min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "output:totalMinutes", expectedDisplayUnit: "min", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "ratio-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:distanceOutput", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:distanceInput", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:distanceOutput", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:distanceInput", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:ratio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:distanceInput", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:ratio", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:distanceOutput", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "ratio-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:acceptableCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:totalCount", expectedDisplayUnit: "samples", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:acceptableCount", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:totalCount", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:acceptableCount", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:totalCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:ratio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:ratio", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:totalCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:acceptableCount", expectedDisplayUnit: "samples", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "linear-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:slope", expectedDisplayUnit: "mV/kPa", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:intercept", expectedDisplayUnit: "mV", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:input", expectedDisplayUnit: "kPa", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:slope", expectedDisplayUnit: "mV/kPa", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:input", expectedDisplayUnit: "kPa", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "input:intercept", expectedDisplayUnit: "mV", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:scaled-input", expectedDisplayUnit: "mV", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "input:intercept", expectedDisplayUnit: "mV", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:output", expectedDisplayUnit: "mV", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:intercept", expectedDisplayUnit: "mV", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "intermediate:scaled-input", expectedDisplayUnit: "mV", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:slope", expectedDisplayUnit: "mV/kPa", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:input", expectedDisplayUnit: "kPa", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "linear-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:slope", expectedDisplayUnit: "V/kg", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:intercept", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:input", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:slope", expectedDisplayUnit: "V/kg", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:input", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "input:intercept", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:scaled-input", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "input:intercept", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:output", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:output", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:intercept", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:slope", expectedDisplayUnit: "V/kg", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:input", expectedDisplayUnit: "kg", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
  ],
  "vector-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:y", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "input:y", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "intermediate:x-square", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "intermediate:y-square", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:sum-of-squares", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:magnitude", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:y", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "output:magnitude", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "vector-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:y", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "intermediate:x-square", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "intermediate:y-square", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "intermediate:sum-of-squares", expectedDisplayUnit: "m^2", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-006", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:magnitude", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:magnitude", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "intermediate:sum-of-squares", expectedDisplayUnit: "m^2", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
  ],
  "eigen-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:diagonalOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:diagonalTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:vectorOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:vectorTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:matrix-vector-first", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "intermediate:matrix-vector-second", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "intermediate:matrix-vector-first", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:matrix-vector-second", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:vectorOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:vectorTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "output:eigenvalue", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:eigenvalue", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:eigenvalue", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:eigen-residual-first", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:eigen-residual-second", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "eigen-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:diagonalOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:diagonalTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:vectorOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:vectorTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:matrix-vector-first", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "intermediate:matrix-vector-second", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "output:eigenvalue", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:eigenvalue", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:eigenvalue", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:eigen-residual-first", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:eigen-residual-second", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "inverseDerivative-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:directSlope", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "constant:affine-intercept", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:directSlope", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:inverseSlope", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "constant:affine-intercept", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:directSlope", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "output:inverseSlope", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "inverseDerivative-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "constant:positive-domain-boundary", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:x", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:direct-slope", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output-component:inverse-slope-numerator", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output-component:inverse-slope-denominator", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "constant:reciprocal-numerator", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:squared-input", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "constant:reciprocal-numerator", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-005", sourceId: "intermediate:direct-slope", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "derivative-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:quadraticCoefficient", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:time", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:derivative-coefficient", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:time", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:derivative-coefficient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "input:time", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:velocity", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:time", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:velocity", expectedDisplayUnit: "m/s", expectedRelation: "approximately-equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "derivative-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:initialPosition", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:finalPosition", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:position-change", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:position-change", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:velocity", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:velocity", expectedDisplayUnit: "m/s", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "intermediate:position-change", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
  ],
  "integral-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:flowRate", expectedDisplayUnit: "L/s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:flowRate", expectedDisplayUnit: "L/s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:accumulatedVolume", expectedDisplayUnit: "L", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:flowRate", expectedDisplayUnit: "L/s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "output:accumulatedVolume", expectedDisplayUnit: "L", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "integral-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:power", expectedDisplayUnit: "W", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:power", expectedDisplayUnit: "J/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:energy", expectedDisplayUnit: "J", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "conversion:energy-kilojoules", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:duration", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:power", expectedDisplayUnit: "W", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "force-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:acceleration", expectedDisplayUnit: "m/s^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:acceleration", expectedDisplayUnit: "m/s^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:force", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:acceleration", expectedDisplayUnit: "m/s^2", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
  ],
  "force-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:acceleration", expectedDisplayUnit: "m/s^2", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:acceleration", expectedDisplayUnit: "m/s^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "stress-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:areaSquareMillimetres", expectedDisplayUnit: "mm^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:areaSquareMillimetres", expectedDisplayUnit: "mm^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "conversion:area-square-metres", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 5e-7, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "conversion:area-square-metres", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 5e-7, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:stress", expectedDisplayUnit: "MPa", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:stress", expectedDisplayUnit: "N/mm^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "output:stress", expectedDisplayUnit: "MPa", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
  ],
  "stress-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:width", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:height", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:section-area", expectedDisplayUnit: "mm^2", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:section-area", expectedDisplayUnit: "mm^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "constant:megapascal-equivalence", expectedDisplayUnit: "N/mm^2", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-003", sourceId: "constant:megapascal-equivalence", expectedDisplayUnit: "MPa", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:stress", expectedDisplayUnit: "MPa", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:stress", expectedDisplayUnit: "MPa", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "intermediate:section-area", expectedDisplayUnit: "mm^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "power-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:torque", expectedDisplayUnit: "N m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:torque", expectedDisplayUnit: "N m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:power", expectedDisplayUnit: "W", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:power", expectedDisplayUnit: "W", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:torque", expectedDisplayUnit: "N m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
  ],
  "power-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:power", expectedDisplayUnit: "W", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:power", expectedDisplayUnit: "W", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:torque", expectedDisplayUnit: "N m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:torque", expectedDisplayUnit: "N m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:power", expectedDisplayUnit: "W", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "ohm-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:resistance", expectedDisplayUnit: "ohm", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:currentMilliamps", expectedDisplayUnit: "mA", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:currentMilliamps", expectedDisplayUnit: "mA", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "conversion:current-amperes", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "conversion:current-amperes", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:resistance", expectedDisplayUnit: "ohm", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:voltage", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:voltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:resistance", expectedDisplayUnit: "ohm", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "conversion:current-amperes", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
  ],
  "ohm-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:voltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:current", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:voltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:current", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:resistance", expectedDisplayUnit: "ohm", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:current", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:resistance", expectedDisplayUnit: "ohm", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:voltage", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "timing-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:count", expectedDisplayUnit: "cycles", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "conversion:frequency-megahertz", expectedDisplayUnit: "MHz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "conversion:frequency-megahertz", expectedDisplayUnit: "MHz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:frequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 50000, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:count", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:frequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 50000, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:durationSeconds", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:durationMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "conversion:frequency-megahertz", expectedDisplayUnit: "MHz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "conversion:cycles-per-millisecond", expectedDisplayUnit: "cycles/ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:count", expectedDisplayUnit: "cycles", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "output:durationMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "timing-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "conversion:frequency-kilohertz", expectedDisplayUnit: "kHz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:count", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:frequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:durationSeconds", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:durationMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "conversion:cycle-period-milliseconds", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:count", expectedDisplayUnit: "cycles", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "output:durationMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "sampling-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:maximumFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "constant:nyquist-factor", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:maximumFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:minimumSamplingFrequency", expectedDisplayUnit: "Hz", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:minimumSamplingFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:maximumFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "sampling-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:samplingFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "constant:nyquist-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:samplingFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:nyquist-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:maximumFrequency", expectedDisplayUnit: "Hz", expectedRelation: "less-than-or-equal", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:maximumFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:samplingFrequency", expectedDisplayUnit: "Hz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "control-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:reference", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:output", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:gain", expectedDisplayUnit: "V/(rad/s)", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:reference", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:output", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "intermediate:error", expectedDisplayUnit: "rad/s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:gain", expectedDisplayUnit: "V/(rad/s)", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:error", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:command", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:command", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:gain", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "intermediate:error", expectedDisplayUnit: "rad/s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "control-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:reference", expectedDisplayUnit: "deg C", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:output", expectedDisplayUnit: "deg C", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:gainPercentPerDegree", expectedDisplayUnit: "percent/deg C", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:error", expectedDisplayUnit: "deg C", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:gainPercentPerDegree", expectedDisplayUnit: "percent/deg C", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "constant:actuator-lower-bound", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:actuator-upper-bound", expectedDisplayUnit: "percent", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:commandPercent", expectedDisplayUnit: "percent", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:commandPercent", expectedDisplayUnit: "percent", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:gainPercentPerDegree", expectedDisplayUnit: "percent/deg C", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "intermediate:error", expectedDisplayUnit: "deg C", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "robot-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input-group:equal-wheel-speeds", expectedDisplayUnit: "m/s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:wheelbase", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:linearSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "robot-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:rightWheelSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:leftWheelSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:wheelbase", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:rightWheelSpeed", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:leftWheelSpeed", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "constant:wheel-average-divisor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:rightWheelSpeed", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:leftWheelSpeed", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:wheelbase", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:linearSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:angularSpeed", expectedDisplayUnit: "rad/s", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "constant:wheel-average-divisor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:rightWheelSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "constant:wheel-average-divisor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:leftWheelSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "estimate-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:measurementOne", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:measurementTwo", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:measurementOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-004", sourceId: "input:measurementTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-005", sourceId: "intermediate:weighted-total", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "intermediate:weight-total", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:weighted-total", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:weight-total", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:estimate", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "estimate-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:measurementOne", expectedDisplayUnit: "deg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:measurementTwo", expectedDisplayUnit: "deg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:measurementOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:measurementTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "intermediate:weighted-total", expectedDisplayUnit: "deg", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "intermediate:weight-total", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:weight-total", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:estimate", expectedDisplayUnit: "deg", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "pinhole-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:focalLengthPixels", expectedDisplayUnit: "px", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:horizontalCoordinate", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:depth", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:principalPoint", expectedDisplayUnit: "px", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:normalised-horizontal-coordinate", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:focalLengthPixels", expectedDisplayUnit: "px", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "input:principalPoint", expectedDisplayUnit: "px", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:pixelCoordinate", expectedDisplayUnit: "px", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:pixelCoordinate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:principalPoint", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:focalLengthPixels", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "intermediate:normalised-horizontal-coordinate", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "pinhole-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:focalLengthPixels", expectedDisplayUnit: "px", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:pixelCoordinate", expectedDisplayUnit: "px", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:principalPoint", expectedDisplayUnit: "px", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:depth", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "intermediate:pixel-offset", expectedDisplayUnit: "px", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:depth", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:focalLengthPixels", expectedDisplayUnit: "px", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:horizontalCoordinate", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:focalLengthPixels", expectedDisplayUnit: "px", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:horizontalCoordinate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:depth", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:principalPoint", expectedDisplayUnit: "px", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-005", sourceId: "input:pixelCoordinate", expectedDisplayUnit: "px", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "metric-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:falsePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:falsePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "intermediate:predicted-positive-count", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:predicted-positive-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:precision", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:precisionPercent", expectedDisplayUnit: "percent", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:false-positive-percent", expectedDisplayUnit: "percent", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "intermediate:predicted-positive-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:falsePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "metric-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:falsePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:falsePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-003", sourceId: "intermediate:predicted-positive-count", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:predicted-positive-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "output:precision", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:precision", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:precisionPercent", expectedDisplayUnit: "percent", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:precision", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "intermediate:predicted-positive-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:truePositive", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "uncertainty-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:uncertaintyOne", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:uncertaintyTwo", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:uncertaintyOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:uncertaintyTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:variance-sum", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:combinedUncertainty", expectedDisplayUnit: "mm", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:combinedUncertainty", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:uncertaintyOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-005", sourceId: "input:uncertaintyTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-006", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
  ],
  "uncertainty-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:uncertaintyOne", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:uncertaintyTwo", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:uncertaintyOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:uncertaintyTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "output:combinedUncertainty", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:combinedUncertainty", expectedDisplayUnit: "K", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:arithmetic-sum", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "partialSensitivity-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:outputChange", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:inputChange", expectedDisplayUnit: "kPa", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:outputChange", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:inputChange", expectedDisplayUnit: "kPa", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:sensitivity", expectedDisplayUnit: "V/kPa", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:sensitivity", expectedDisplayUnit: "V/kPa", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:inputChange", expectedDisplayUnit: "kPa", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:outputChange", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "partialSensitivity-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:outputChange", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:inputChange", expectedDisplayUnit: "W", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:outputChange", expectedDisplayUnit: "K", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:inputChange", expectedDisplayUnit: "W", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:sensitivity", expectedDisplayUnit: "K/W", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:sensitivity", expectedDisplayUnit: "K/W", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:inputChange", expectedDisplayUnit: "W", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:outputChange", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "firstOrderStep-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:finalValue", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:time", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:timeConstant", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:finalValue", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:unity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "intermediate:negative-time", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:time", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:normalised-negative-time", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:exponential-decay", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:response", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:response-percent", expectedDisplayUnit: "percent", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "firstOrderStep-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:finalValue", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:timeConstant", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:time", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:finalValue", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:unity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "intermediate:negative-time", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:timeConstant", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:normalised-negative-time", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:exponential-decay", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:response", expectedDisplayUnit: "K", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:remaining-error", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:remaining-error-percent", expectedDisplayUnit: "percent", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "mean-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:sample-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:sample-total", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:sample-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:mean", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:a-deviation", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:b-deviation", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:a", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "mean-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:d", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:a", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:b", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:c", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:d", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "constant:sample-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:sample-total", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:sample-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:mean", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:a-deviation", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:b-deviation", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:c-deviation", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "check:d-deviation", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "oscillation-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:stiffness", expectedDisplayUnit: "N/m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:stiffness", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:radians-to-cycles-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:natural-angular-frequency", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:radians-to-cycles-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:naturalFrequency", expectedDisplayUnit: "Hz", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:naturalFrequency", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:period", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
  ],
  "oscillation-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:stiffness", expectedDisplayUnit: "N/m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:stiffness", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:radians-to-cycles-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:stiffness-mass-ratio", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:natural-angular-frequency", expectedDisplayUnit: "rad/s", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:naturalFrequency", expectedDisplayUnit: "Hz", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 0 },
  ],
  "coulomb-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "conversion:charge-one-microcoulombs", expectedDisplayUnit: "microcoulomb", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:separation", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:coulombConstant", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 50000, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:chargeOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:chargeTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:separation", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:forceMagnitude", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
  ],
  "coulomb-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "conversion:charge-one-microcoulombs", expectedDisplayUnit: "microcoulombs", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "conversion:charge-two-microcoulombs", expectedDisplayUnit: "microcoulomb", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:separation", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:coulombConstant", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 50000, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:chargeOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:chargeTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:separation", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:forceMagnitude", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
  ],
  "heatConduction-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:conductivity", expectedDisplayUnit: "W/(m K)", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:area", expectedDisplayUnit: "m^2", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:temperatureDifference", expectedDisplayUnit: "K", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:thickness", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:conductivity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:area", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:temperatureDifference", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:thickness", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:heatRate", expectedDisplayUnit: "W", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:thermal-resistance", expectedDisplayUnit: "K/W", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:temperatureDifference", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:thermal-resistance", expectedDisplayUnit: "K/W", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "output:heatRate", expectedDisplayUnit: "W", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "heatConduction-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:conductivity", expectedDisplayUnit: "W/(m K)", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:area", expectedDisplayUnit: "m^2", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:area", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:temperatureDifference", expectedDisplayUnit: "K", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:thickness", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:conductivity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:area", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:temperatureDifference", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:thickness", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:heatRate", expectedDisplayUnit: "W", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:thermal-resistance", expectedDisplayUnit: "K/W", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:temperatureDifference", expectedDisplayUnit: "K", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:thermal-resistance", expectedDisplayUnit: "K/W", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "output:heatRate", expectedDisplayUnit: "W", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "spring-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:stiffness", expectedDisplayUnit: "N/m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:displacement", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:stiffness", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:displacement", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:force", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:stiffness", expectedDisplayUnit: "N/m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:displacement", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
  ],
  "spring-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:displacement", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:displacement", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:stiffness", expectedDisplayUnit: "N/m", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:stiffness", expectedDisplayUnit: "N/m", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:displacement", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:force", expectedDisplayUnit: "N", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "machiningSpeed-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "conversion:diameter-millimetres", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:revolutionsPerMinute", expectedDisplayUnit: "rev/min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:diameter", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:revolutionsPerMinute", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:seconds-per-minute", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:surfaceSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "conversion:surface-speed-metres-per-minute", expectedDisplayUnit: "m/min", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "conversion:surface-speed-metres-per-minute", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "constant:seconds-per-minute", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "output:surfaceSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 0 },
  ],
  "machiningSpeed-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "conversion:diameter-millimetres", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:revolutionsPerMinute", expectedDisplayUnit: "rev/min", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:diameter", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:revolutionsPerMinute", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:seconds-per-minute", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:surfaceSpeed", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:diameter", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:distance-per-revolution", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "conversion:revolutions-per-second", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "rcCutoff-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "conversion:resistance-display", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "conversion:capacitance-display", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "constant:reciprocal-numerator", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:radians-to-cycles-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:resistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:capacitance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:cutoffFrequency", expectedDisplayUnit: "Hz", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "conversion:time-constant-milliseconds", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:reciprocal-numerator", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "constant:radians-to-cycles-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "intermediate:time-constant", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-005", sourceId: "output:cutoffFrequency", expectedDisplayUnit: "Hz", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 0 },
  ],
  "rcCutoff-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "conversion:resistance-display", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "conversion:capacitance-display", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "constant:reciprocal-numerator", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:radians-to-cycles-factor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:resistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:capacitance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "conversion:time-constant-milliseconds", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:cutoffFrequency", expectedDisplayUnit: "Hz", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "intermediate:time-constant", expectedDisplayUnit: "s", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
  ],
  "adcResolution-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:bitCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:referenceVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:referenceVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:code-level-count", expectedDisplayUnit: "levels", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:resolutionVolts", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 5e-8, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:resolutionMillivolts", expectedDisplayUnit: "mV", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:resolutionMillivolts", expectedDisplayUnit: "mV", expectedRelation: "stated", absoluteTolerance: 0.00005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "intermediate:code-level-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:referenceVoltage", expectedDisplayUnit: "V", expectedRelation: "approximately-equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
  ],
  "adcResolution-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:bitCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:referenceVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "intermediate:code-level-count", expectedDisplayUnit: "levels", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:referenceVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "intermediate:code-level-count", expectedDisplayUnit: "levels", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:resolutionVolts", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 0.000005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:resolutionVolts", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.000005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "intermediate:code-level-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:referenceVoltage", expectedDisplayUnit: "V", expectedRelation: "approximately-equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
  ],
  "pwmDuty-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:onTime", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:period", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:onTime", expectedDisplayUnit: "ms", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:period", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:dutyRatio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:dutyPercent", expectedDisplayUnit: "percent", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:dutyPercent", expectedDisplayUnit: "percent", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:onTime", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:period", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "pwmDuty-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:frequencyKilohertz", expectedDisplayUnit: "kHz", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:onTimeMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "output:periodMilliseconds", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "output:periodMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:onTimeMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "output:periodMilliseconds", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:dutyRatio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:dutyPercent", expectedDisplayUnit: "percent", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:off-time", expectedDisplayUnit: "ms", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "fourier-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:sampleZero", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:sampleOne", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:sampleTwo", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:sampleThree", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:sampleThree", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:sampleTwo", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:sampleOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:sampleTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:sampleThree", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:dcCoefficient", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:dcCoefficient", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:dcCoefficient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:sampleTwo", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "fourier-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:sampleZero", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:sampleOne", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:sampleTwo", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:sampleThree", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:sampleOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:sampleOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:sampleOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:sampleOne", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:dcCoefficient", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:sampleOne", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "stateSpace-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:stateCoefficient", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:inputCoefficient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:state", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:input", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:stateCoefficient", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:state", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:inputCoefficient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:input", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "input:stateCoefficient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:input-contribution", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:stateDerivative", expectedDisplayUnit: "per second", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "constant:euler-step-seconds", expectedDisplayUnit: "s", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:euler-state-increment", expectedDisplayUnit: "", expectedRelation: "approximately-equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "stateSpace-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:inputCoefficient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:state", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:input", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "intermediate:state-contribution", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:inputCoefficient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:input", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:stateDerivative", expectedDisplayUnit: "per second", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "rigidTransform-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:y", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:y", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:cosine", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:rotatedX", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:rotatedX", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:radicand", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:x", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "rigidTransform-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:y", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:x", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:y", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "input:angleDegrees", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:sine", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:rotatedX", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:rotatedX", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:x", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:y", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "jacobian-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:jacobian", expectedDisplayUnit: "m/rad", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:jointRate", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:jacobian", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:jointRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:taskVelocity", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:taskVelocity", expectedDisplayUnit: "m/s", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:jointRate", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:jacobian", expectedDisplayUnit: "m/rad", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
  ],
  "jacobian-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:jacobian", expectedDisplayUnit: "m/rad", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:jointRate", expectedDisplayUnit: "rad/s", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:jacobian", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:jointRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:taskVelocity", expectedDisplayUnit: "m/s", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "inertia-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:radius", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:radius", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:inertia", expectedDisplayUnit: "kg m^2", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:doubled-radius", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:doubled-radius-inertia", expectedDisplayUnit: "kg m^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "inertia-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "kg", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:radius", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:radius", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "input:mass", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:radius-square", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:inertia", expectedDisplayUnit: "kg m^2", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "intermediate:radius-square", expectedDisplayUnit: "m^2", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:radius", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "bayes-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:prior", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:sensitivity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:falsePositiveRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:sensitivity", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:prior", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:sensitivity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:prior", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:falsePositiveRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-006", sourceId: "intermediate:prior-complement", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:true-alarm-term", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:alarm-probability", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:posterior", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "constant:hypothetical-population", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:true-alarm-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:false-alarm-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "check:true-alarm-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-005", sourceId: "check:alarm-count", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-006", sourceId: "output:posterior", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
  ],
  "bayes-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:prior", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:sensitivity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:falsePositiveRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:sensitivity", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:prior", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:sensitivity", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:prior", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:falsePositiveRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-006", sourceId: "intermediate:prior-complement", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:true-alarm-term", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:alarm-probability", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:posterior", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
  ],
  "pathCost-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:accumulatedCost", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:heuristicCost", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:accumulatedCost", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:heuristicCost", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:totalCost", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:heuristicCost", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:totalCost", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:accumulatedCost", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "pathCost-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:accumulatedCost", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:heuristicCost", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:accumulatedCost", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:heuristicCost", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:totalCost", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "neuron-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:featureOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:featureTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:bias", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:featureOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:featureTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:bias", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:weighted-contribution-one", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:weighted-contribution-two", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-003", sourceId: "input:bias", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:affineOutput", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:weighted-input-contribution", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
  ],
  "neuron-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:featureOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:featureTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:bias", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:featureOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:featureTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "intermediate:bias-subtraction-magnitude", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:weighted-contribution-one", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:weighted-contribution-two", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-003", sourceId: "input:bias", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:affineOutput", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "gradientDescent-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:parameter", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:learningRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:gradient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:parameter", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:learningRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:gradient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:update-step-magnitude", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:updatedParameter", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "gradientDescent-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:parameter", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:learningRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:gradient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:parameter", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:learningRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:gradient", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:update-step-magnitude", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:updatedParameter", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "compression-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:originalSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:compressedSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:originalSize", expectedDisplayUnit: "MB", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:compressedSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:compressionRatio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "compression-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:originalSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:compressedSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:originalSize", expectedDisplayUnit: "MB", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:compressedSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:compressionRatio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:compressedSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:compressionRatio", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:originalSize", expectedDisplayUnit: "MB", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "tradeScore-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:scoreOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:scoreTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:scoreOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:scoreTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:contribution-one", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:contribution-two", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:weightedScore", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:scoreTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:scoreOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "tradeScore-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:scoreOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:scoreTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:scoreThree", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-006", sourceId: "input:weightThree", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:weightOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:scoreOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:weightTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:scoreTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:weightThree", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-006", sourceId: "input:scoreThree", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:contribution-one", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:contribution-two", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-003", sourceId: "intermediate:contribution-three", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:weightedScore", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:weightedScore", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "riskScore-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:likelihoodRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:consequenceRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:likelihoodRank", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:consequenceRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:riskScore", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:likelihoodRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:consequenceRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "riskScore-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:likelihoodRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:consequenceRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:likelihoodRank", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:consequenceRank", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:riskScore", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "complexMagnitude-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:real", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:real", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:imaginary", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:sum-of-squares", expectedDisplayUnit: "V^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:magnitude", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:real", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:imaginary", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "output:magnitude", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
  ],
  "complexMagnitude-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:real", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:real", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:imaginary", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:sum-of-squares", expectedDisplayUnit: "ohm^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:magnitude", expectedDisplayUnit: "ohm", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:magnitude", expectedDisplayUnit: "ohm", expectedRelation: "stated", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:real-square", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:imaginary-square", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "intermediate:sum-of-squares", expectedDisplayUnit: "ohm^2", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "toleranceStack-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:toleranceOne", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:toleranceTwo", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:toleranceThree", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:toleranceOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:toleranceTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:toleranceThree", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:worstCaseTolerance", expectedDisplayUnit: "mm", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:worstCaseTolerance", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
  ],
  "toleranceStack-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:toleranceOne", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:toleranceTwo", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:toleranceOne", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:toleranceTwo", expectedDisplayUnit: "mm", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:worstCaseTolerance", expectedDisplayUnit: "mm", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
  ],
  "probability-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:totalCount", expectedDisplayUnit: "trials", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:eventCount", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:totalCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:probability", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:probability", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:totalCount", expectedDisplayUnit: "trials", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:eventCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "probability-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:totalCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:eventCount", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:totalCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:probability", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:totalCount", expectedDisplayUnit: "outcomes", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:eventCount", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "featureMatchRatio-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:nearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:secondNearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:nearestDistance", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:secondNearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:matchRatio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
  ],
  "featureMatchRatio-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:nearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:secondNearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:nearestDistance", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:secondNearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:matchRatio", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:matchRatio", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:secondNearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:nearestDistance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "transferMagnitude-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:inputAmplitude", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:outputAmplitude", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:outputAmplitude", expectedDisplayUnit: "V", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:inputAmplitude", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:transferMagnitude", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:transferMagnitude", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "input:inputAmplitude", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "input:outputAmplitude", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "transferMagnitude-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:inputAmplitude", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:outputAmplitude", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:outputAmplitude", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:inputAmplitude", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:transferMagnitude", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
  ],
  "pid-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:proportionalGain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:integralGain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:derivativeGain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:error", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:integralError", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-006", sourceId: "input:errorRate", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:integralError", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:error", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:integralGain", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:integralError", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:derivativeGain", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-006", sourceId: "input:errorRate", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "input:integralError", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "input:error", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-003", sourceId: "intermediate:derivative-contribution", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:command", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:command", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
  ],
  "pid-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:proportionalGain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:integralGain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:derivativeGain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:error", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:integralError", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:proportionalGain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:error", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:integralGain", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:integralError", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:derivativeGain", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:proportional-contribution", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:integral-contribution", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:command", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "intermediate:integral-contribution", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "intermediate:proportional-contribution", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "reliability-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:reliabilityOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:reliabilityTwo", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:reliabilityOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:reliability", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "constant:certainty", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:reliability", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.00005, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "check:failure-probability", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 1e-12 },
  ],
  "reliability-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:reliabilityOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:reliabilityTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:reliabilityThree", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-001", sourceId: "input:reliabilityOne", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-01-NUMERIC-002", sourceId: "input:reliabilityTwo", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:reliabilityThree", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:reliability", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "input:reliabilityThree", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
  ],
  "diodeShockley-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:saturationCurrentNanoamps", expectedDisplayUnit: "nA", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:idealityFactor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "conversion:thermal-voltage-millivolts", expectedDisplayUnit: "mV", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:junctionVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:saturationCurrentNanoamps", expectedDisplayUnit: "nA", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:junctionVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:idealityFactor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:thermalVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:saturationCurrentNanoamps", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:diodeCurrent", expectedDisplayUnit: "mA", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "conversion:diode-current-microamps", expectedDisplayUnit: "microamps", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "output:diodeCurrent", expectedDisplayUnit: "mA", expectedRelation: "stated", absoluteTolerance: 0.00005, relativeTolerance: 0 },
  ],
  "diodeShockley-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:junctionVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:saturationCurrentNanoamps", expectedDisplayUnit: "nA", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:junctionVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:idealityFactor", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:thermalVoltage", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:saturationCurrentNanoamps", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:diodeCurrent", expectedDisplayUnit: "mA", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "constant:comparison-voltage-increase", expectedDisplayUnit: "V", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 0 },
  ],
  "kalmanUpdate-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:predictedState", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:predictedVariance", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:predictedState", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:measurement", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:measurementVariance", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-006", sourceId: "input:predictedState", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:predictedVariance", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:predictedVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:measurementVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "output:gain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "output:gain", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:innovation", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:posteriorState", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:posteriorVariance", expectedDisplayUnit: "m^2", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-003", sourceId: "input:predictedState", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
  ],
  "kalmanUpdate-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:predictedState", expectedDisplayUnit: "deg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:predictedVariance", expectedDisplayUnit: "deg^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:measurement", expectedDisplayUnit: "deg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:measurementVariance", expectedDisplayUnit: "deg^2", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-006", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "input:predictedVariance", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:predictedVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "input:measurementVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "output:gain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:innovation", expectedDisplayUnit: "deg", expectedRelation: "stated", absoluteTolerance: 1e-12, relativeTolerance: 1e-12 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:posteriorState", expectedDisplayUnit: "deg", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-002", sourceId: "output:posteriorVariance", expectedDisplayUnit: "deg^2", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "RESULT-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
  ],
  "extendedKalmanUpdate-CASE-01": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:predictedState", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "input:predictedVariance", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "input:measurement", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-006", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-007", sourceId: "input:measurementVariance", expectedDisplayUnit: "m^4", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-008", sourceId: "constant:fourth-power-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "constant:quadratic-derivative-coefficient", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "input:predictedState", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "output:observationJacobian", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "output:observationJacobian", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-006", sourceId: "input:predictedVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-007", sourceId: "input:measurementVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-008", sourceId: "output:innovationCovariance", expectedDisplayUnit: "m^4", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-009", sourceId: "constant:fourth-power-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "output:gain", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "intermediate:innovation", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "output:posteriorState", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "output:posteriorState", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "check:nonlinear-posterior-observation", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "CHECK-NUMERIC-004", sourceId: "input:measurement", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-005", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
  ],
  "extendedKalmanUpdate-CASE-02": [
    { claimId: "PROBLEM-NUMERIC-001", sourceId: "input:predictedState", expectedDisplayUnit: "m", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-002", sourceId: "input:predictedVariance", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-004", sourceId: "input:measurement", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.05, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-005", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "PROBLEM-NUMERIC-006", sourceId: "input:measurementVariance", expectedDisplayUnit: "m^4", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "PROBLEM-NUMERIC-007", sourceId: "constant:fourth-power-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-001", sourceId: "output:observationJacobian", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.05, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-002", sourceId: "output:observationJacobian", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 1e-9, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-003", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-004", sourceId: "input:predictedVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-005", sourceId: "input:measurementVariance", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-02-NUMERIC-006", sourceId: "output:innovationCovariance", expectedDisplayUnit: "m^4", expectedRelation: "equals", absoluteTolerance: 0.005, relativeTolerance: 1e-9 },
    { claimId: "STEP-02-NUMERIC-007", sourceId: "constant:fourth-power-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "STEP-02-NUMERIC-008", sourceId: "output:gain", expectedDisplayUnit: "", expectedRelation: "equals", absoluteTolerance: 0.00005, relativeTolerance: 0 },
    { claimId: "STEP-03-NUMERIC-001", sourceId: "intermediate:innovation-magnitude", expectedDisplayUnit: "m^2", expectedRelation: "stated", absoluteTolerance: 0.005, relativeTolerance: 1e-12 },
    { claimId: "STEP-03-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
    { claimId: "RESULT-NUMERIC-001", sourceId: "conversion:rounded-posterior-state", expectedDisplayUnit: "m", expectedRelation: "equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-001", sourceId: "check:nonlinear-posterior-observation", expectedDisplayUnit: "m^2", expectedRelation: "approximately-equals", absoluteTolerance: 0.0005, relativeTolerance: 1e-12 },
    { claimId: "CHECK-NUMERIC-002", sourceId: "constant:square-exponent", expectedDisplayUnit: "", expectedRelation: "stated", absoluteTolerance: 0, relativeTolerance: 0 },
  ],
} satisfies Record<
  WorkedExampleOracleId,
  readonly WorkedExampleTypedClaimBinding[]
>;

const defineFamily = (
  familyId: string,
  formulaSignature: string,
  seeds: readonly [CaseSeed, CaseSeed]
): WorkedExampleFamilyVerification => ({
  familyId,
  formulaSignature,
  cases: seeds.map((seed, caseIndex) => {
    const id = (
      `${familyId}-CASE-${String(caseIndex + 1).padStart(2, "0")}`
    ) as WorkedExampleOracleId;
    const numericDisplayContract = workedExampleNumericDisplayContracts[id];
    return {
      id,
      familyId,
      sourceExampleIndex: (caseIndex + 1) as 1 | 2,
      oracleId: id,
      displayNumericClaimCount: numericDisplayContract.count,
      displayNumericClaimsFingerprint: numericDisplayContract.fingerprint,
      displayTypedClaimCount: numericDisplayContract.count,
      displayTypedClaimsFingerprint: numericDisplayContract.typedFingerprint,
      displayTypedClaimBindings: workedExampleTypedClaimBindings[id],
      displayUnitImplicitClaimIds: workedExampleUnitImplicitClaimIds[id],
      ...seed
    };
  }) as unknown as readonly [
    IndependentWorkedExampleCase,
    IndependentWorkedExampleCase
  ]
});

export const workedExampleVerificationFamilies = {
  sum: defineFamily("sum", "total = sum of components", [
    {
      displayFingerprint: "fnv1a32:6a4c1c09",
      inputs: {
        a: input(10, "min"),
        b: input(15, "min"),
        c: input(20, "min"),
        d: input(5, "min")
      },
      assertions: [
        assertion("totalMinutes", 50, "min", "50 min")
      ]
    },
    {
      displayFingerprint: "fnv1a32:b968c7c4",
      inputs: {
        a: input(180, "s"),
        b: input(240, "s"),
        c: input(300, "s")
      },
      assertions: [
        assertion("totalSeconds", 720, "s", "720 s"),
        assertion("totalMinutes", 12, "min", "12 min")
      ]
    }
  ]),
  ratio: defineFamily("ratio", "ratio = compared quantity / reference quantity", [
    {
      displayFingerprint: "fnv1a32:7c9b3163",
      inputs: {
        distanceOutput: input(0.3, "m"),
        distanceInput: input(0.1, "m", 1e-12)
      },
      assertions: [
        assertion("ratio", 3, "1", "3.0")
      ]
    },
    {
      displayFingerprint: "fnv1a32:99dc2a7d",
      inputs: {
        acceptableCount: input(45, "samples", 0),
        totalCount: input(50, "samples", 1)
      },
      assertions: [
        assertion("ratio", 0.9, "1", "0.90")
      ]
    }
  ]),
  linear: defineFamily("linear", "output = slope * input + intercept", [
    {
      displayFingerprint: "fnv1a32:cc6c9ae4",
      inputs: {
        slope: input(2, "mV/kPa"),
        input: input(40, "kPa"),
        intercept: input(10, "mV")
      },
      assertions: [
        assertion("output", 90, "mV", "90 mV")
      ]
    },
    {
      displayFingerprint: "fnv1a32:a217e443",
      inputs: {
        slope: input(0.5, "V/kg"),
        input: input(6, "kg"),
        intercept: input(0.2, "V")
      },
      assertions: [
        assertion("output", 3.2, "V", "3.2 V")
      ]
    }
  ]),
  vector: defineFamily("vector", "magnitude = sqrt(x^2 + y^2)", [
    {
      displayFingerprint: "fnv1a32:bc240b07",
      inputs: { x: input(3, "m"), y: input(4, "m") },
      assertions: [
        assertion("magnitude", 5, "m", "5.0 m")
      ]
    },
    {
      displayFingerprint: "fnv1a32:fac0d8a0",
      inputs: { x: input(0.12, "m"), y: input(0.05, "m") },
      assertions: [
        assertion("magnitude", 0.13, "m", "0.13 m")
      ]
    }
  ]),
  eigen: defineFamily("eigen", "A v = lambda v for a selected diagonal mode", [
    {
      displayFingerprint: "fnv1a32:60f50fd1",
      inputs: {
        diagonalOne: input(2, "1"),
        diagonalTwo: input(3, "1"),
        vectorOne: input(1, "1"),
        vectorTwo: input(0, "1")
      },
      assertions: [
        assertion("eigenvalue", 2, "1", "lambda = 2")
      ]
    },
    {
      displayFingerprint: "fnv1a32:20a385c6",
      inputs: {
        diagonalOne: input(4, "1"),
        diagonalTwo: input(1, "1"),
        vectorOne: input(0, "1"),
        vectorTwo: input(1, "1")
      },
      assertions: [
        assertion("eigenvalue", 1, "1", "lambda = 1")
      ]
    }
  ]),
  inverseDerivative: defineFamily(
    "inverseDerivative",
    "inverse derivative = reciprocal of direct derivative",
    [
      {
        displayFingerprint: "fnv1a32:3bae6c01",
        inputs: { directSlope: input(2, "1", 1e-12) },
        assertions: [
          assertion("inverseSlope", 0.5, "1", "0.5")
        ]
      },
      {
        displayFingerprint: "fnv1a32:13c31324",
        inputs: { x: input(3, "1", 1e-12) },
        assertions: [
          assertion("inverseSlope", 1 / 6, "1", "1/6")
        ]
      }
    ]
  ),
  derivative: defineFamily("derivative", "velocity is position derivative", [
    {
      displayFingerprint: "fnv1a32:24308704",
      inputs: {
        quadraticCoefficient: input(2, "m/s^2"),
        time: input(3, "s")
      },
      assertions: [
        assertion("velocity", 12, "m/s", "12 m/s")
      ]
    },
    {
      displayFingerprint: "fnv1a32:eb61da21",
      inputs: {
        initialPosition: input(1, "m"),
        finalPosition: input(1.8, "m"),
        duration: input(0.2, "s", 1e-12)
      },
      assertions: [
        assertion("velocity", 4, "m/s", "4.0 m/s")
      ]
    }
  ]),
  integral: defineFamily("integral", "accumulation = constant rate * duration", [
    {
      displayFingerprint: "fnv1a32:3e767c61",
      inputs: {
        flowRate: input(0.2, "L/s"),
        duration: input(30, "s", 0)
      },
      assertions: [
        assertion("accumulatedVolume", 6, "L", "6.0 L")
      ]
    },
    {
      displayFingerprint: "fnv1a32:c54ef173",
      inputs: {
        power: input(50, "W"),
        duration: input(120, "s", 0)
      },
      assertions: [
        assertion("energy", 6000, "J", "6000 J")
      ]
    }
  ]),
  force: defineFamily("force", "force = mass * acceleration", [
    {
      displayFingerprint: "fnv1a32:293ee8ab",
      inputs: {
        mass: input(12, "kg", 0),
        acceleration: input(0.5, "m/s^2")
      },
      assertions: [
        assertion("force", 6, "N", "6.0 N")
      ]
    },
    {
      displayFingerprint: "fnv1a32:64eb6bfd",
      inputs: {
        force: input(10, "N"),
        mass: input(2.5, "kg", 1e-12)
      },
      assertions: [
        assertion("acceleration", 4, "m/s^2", "4.0 m/s^2")
      ]
    }
  ]),
  stress: defineFamily("stress", "stress = force / area", [
    {
      displayFingerprint: "fnv1a32:24cc18a7",
      inputs: {
        force: input(2000, "N"),
        areaSquareMillimetres: input(400, "mm^2", 1e-12)
      },
      assertions: [
        assertion("stress", 5, "MPa", "5.00 MPa")
      ]
    },
    {
      displayFingerprint: "fnv1a32:1f249e23",
      inputs: {
        width: input(10, "mm", 1e-12),
        height: input(5, "mm", 1e-12),
        force: input(1500, "N")
      },
      assertions: [
        assertion("stress", 30, "MPa", "30 MPa")
      ]
    }
  ]),
  power: defineFamily("power", "rotational power = torque * angular speed", [
    {
      displayFingerprint: "fnv1a32:70f3d181",
      inputs: {
        torque: input(8, "N m"),
        angularSpeed: input(25, "rad/s")
      },
      assertions: [
        assertion("power", 200, "W", "200 W")
      ]
    },
    {
      displayFingerprint: "fnv1a32:ab6d8a98",
      inputs: {
        power: input(600, "W"),
        angularSpeed: input(100, "rad/s", 1e-12)
      },
      assertions: [
        assertion("torque", 6, "N m", "6.0 N m")
      ]
    }
  ]),
  ohm: defineFamily("ohm", "voltage = current * resistance", [
    {
      displayFingerprint: "fnv1a32:e578a33c",
      inputs: {
        resistance: input(220, "ohm", 0),
        currentMilliamps: input(15, "mA")
      },
      assertions: [
        assertion("voltage", 3.3, "V", "3.3 V")
      ]
    },
    {
      displayFingerprint: "fnv1a32:9512f5dc",
      inputs: {
        voltage: input(24, "V"),
        current: input(0.5, "A", 1e-12)
      },
      assertions: [
        assertion("resistance", 48, "ohm", "48 ohm")
      ]
    }
  ]),
  timing: defineFamily("timing", "duration = count / frequency", [
    {
      displayFingerprint: "fnv1a32:6327427c",
      inputs: {
        count: input(5000, "cycles", 0),
        frequency: input(1e6, "Hz", 1e-12)
      },
      assertions: [
        assertion("durationSeconds", 0.005, "s", "0.005 s"),
        assertion("durationMilliseconds", 5, "ms", "5 ms")
      ]
    },
    {
      displayFingerprint: "fnv1a32:f63fa348",
      inputs: {
        count: input(20, "cycles", 0),
        frequency: input(10_000, "Hz", 1e-12)
      },
      assertions: [
        assertion("durationSeconds", 0.002, "s", "0.002 s"),
        assertion("durationMilliseconds", 2, "ms", "2 ms")
      ]
    }
  ]),
  sampling: defineFamily("sampling", "Nyquist boundary links sample and signal frequency", [
    {
      displayFingerprint: "fnv1a32:04a9ad14",
      inputs: { maximumFrequency: input(80, "Hz", 0) },
      assertions: [
        assertion("minimumSamplingFrequency", 160, "Hz", "160 Hz")
      ]
    },
    {
      displayFingerprint: "fnv1a32:1e6d3085",
      inputs: { samplingFrequency: input(1000, "Hz", 0) },
      assertions: [
        assertion(
          "maximumFrequency",
          500,
          "Hz",
          "500 Hz",
          1e-9,
          1e-9,
          "less-than-or-equal"
        )
      ]
    }
  ]),
  control: defineFamily("control", "command = gain * (reference - output)", [
    {
      displayFingerprint: "fnv1a32:bba8e3f5",
      inputs: {
        reference: input(10, "rad/s"),
        output: input(8, "rad/s"),
        gain: input(2, "V/(rad/s)")
      },
      assertions: [
        assertion("command", 4, "V", "4 V")
      ]
    },
    {
      displayFingerprint: "fnv1a32:753efaf3",
      inputs: {
        reference: input(50, "deg C"),
        output: input(47, "deg C"),
        gainPercentPerDegree: input(10, "percent/deg C")
      },
      assertions: [
        assertion("commandPercent", 30, "percent", "30 percent")
      ]
    }
  ]),
  robot: defineFamily("robot", "differential-drive linear and angular speed", [
    {
      displayFingerprint: "fnv1a32:25dde5df",
      inputs: {
        rightWheelSpeed: {
          ...input(0.6, "m/s"),
          displayedValueRequired: false,
          displayBindingMode: "shared-equal-inputs",
          displayOmissionReason: "The phrase both wheels binds one explicit 0.60 m/s claim to the named left and right inputs."
        },
        leftWheelSpeed: {
          ...input(0.6, "m/s"),
          displayedValueRequired: false,
          displayBindingMode: "shared-equal-inputs",
          displayOmissionReason: "The phrase both wheels binds one explicit 0.60 m/s claim to the named left and right inputs."
        },
        wheelbase: input(0.4, "m", 1e-12)
      },
      assertions: [
        assertion("linearSpeed", 0.6, "m/s", "v = 0.60 m/s"),
        assertion("angularSpeed", 0, "rad/s", "omega = 0 rad/s")
      ]
    },
    {
      displayFingerprint: "fnv1a32:e2e7cf55",
      inputs: {
        rightWheelSpeed: input(0.5, "m/s"),
        leftWheelSpeed: input(0.1, "m/s"),
        wheelbase: input(0.4, "m", 1e-12)
      },
      assertions: [
        assertion("linearSpeed", 0.3, "m/s", "v = 0.30 m/s"),
        assertion("angularSpeed", 1, "rad/s", "omega = 1.0 rad/s")
      ]
    }
  ]),
  estimate: defineFamily("estimate", "weighted mean estimate", [
    {
      displayFingerprint: "fnv1a32:5defd8ee",
      inputs: {
        measurementOne: input(2, "m"),
        measurementTwo: input(2.4, "m"),
        weightOne: input(3, "1", 0),
        weightTwo: input(1, "1", 0)
      },
      assertions: [
        assertion("estimate", 2.1, "m", "2.1 m")
      ]
    },
    {
      displayFingerprint: "fnv1a32:71f0757b",
      inputs: {
        measurementOne: input(10, "deg"),
        measurementTwo: input(14, "deg"),
        weightOne: {
          ...input(1, "1", 0),
          displayedValueRequired: false,
          displayBindingMode: "implicit-coefficient",
          displayOmissionReason: "The prose states equal weighting without displaying the implicit coefficient 1."
        },
        weightTwo: {
          ...input(1, "1", 0),
          displayedValueRequired: false,
          displayBindingMode: "implicit-coefficient",
          displayOmissionReason: "The prose states equal weighting without displaying the implicit coefficient 1."
        }
      },
      assertions: [
        assertion("estimate", 12, "deg", "12 deg")
      ]
    }
  ]),
  pinhole: defineFamily("pinhole", "pixel coordinate = fx * X / Z + cx", [
    {
      displayFingerprint: "fnv1a32:db6fee2f",
      inputs: {
        focalLengthPixels: input(500, "px", 1e-12),
        horizontalCoordinate: input(0.2, "m"),
        depth: input(2, "m", 1e-12),
        principalPoint: input(320, "px")
      },
      assertions: [
        assertion("pixelCoordinate", 370, "px", "370 px")
      ]
    },
    {
      displayFingerprint: "fnv1a32:9a3d8b28",
      inputs: {
        focalLengthPixels: input(600, "px", 1e-12),
        pixelCoordinate: input(420, "px"),
        principalPoint: input(300, "px"),
        depth: input(3, "m", 1e-12)
      },
      assertions: [
        assertion("horizontalCoordinate", 0.6, "m", "0.60 m")
      ]
    }
  ]),
  metric: defineFamily("metric", "precision = true positive / predicted positive", [
    {
      displayFingerprint: "fnv1a32:7a72df60",
      inputs: {
        truePositive: input(18, "count", 0),
        falsePositive: input(2, "count", 0)
      },
      assertions: [
        assertion("precision", 0.9, "1", "0.90"),
        assertion("precisionPercent", 90, "percent", "90 percent")
      ]
    },
    {
      displayFingerprint: "fnv1a32:4edd0b55",
      inputs: {
        truePositive: input(45, "count", 0),
        falsePositive: input(15, "count", 0)
      },
      assertions: [
        assertion("precision", 0.75, "1", "0.75"),
        assertion("precisionPercent", 75, "percent", "75 percent")
      ]
    }
  ]),
  uncertainty: defineFamily("uncertainty", "combined uncertainty = root sum square", [
    {
      displayFingerprint: "fnv1a32:69f5014a",
      inputs: {
        uncertaintyOne: input(0.3, "mm", 0),
        uncertaintyTwo: input(0.4, "mm", 0)
      },
      assertions: [
        assertion("combinedUncertainty", 0.5, "mm", "0.50 mm")
      ]
    },
    {
      displayFingerprint: "fnv1a32:0f11a92c",
      inputs: {
        uncertaintyOne: input(0.6, "K", 0),
        uncertaintyTwo: input(0.8, "K", 0)
      },
      assertions: [
        assertion("combinedUncertainty", 1, "K", "1.00 K")
      ]
    }
  ]),
  partialSensitivity: defineFamily(
    "partialSensitivity",
    "local sensitivity = output change / input change",
    [
      {
        displayFingerprint: "fnv1a32:4432d451",
        inputs: {
          outputChange: input(6, "V"),
          inputChange: input(3, "kPa", 1e-12)
        },
        assertions: [
          assertion("sensitivity", 2, "V/kPa", "2 V/kPa")
        ]
      },
      {
        displayFingerprint: "fnv1a32:fdf27e46",
        inputs: {
          outputChange: input(8, "K"),
          inputChange: input(4, "W", 1e-12)
        },
        assertions: [
          assertion("sensitivity", 2, "K/W", "2 K/W")
        ]
      }
    ]
  ),
  firstOrderStep: defineFamily(
    "firstOrderStep",
    "response = final value * (1 - exp(-time/time constant))",
    [
      {
        displayFingerprint: "fnv1a32:1455ca6d",
        inputs: {
          finalValue: input(10, "V"),
          time: input(2, "s", 0),
          timeConstant: input(2, "s", 1e-12)
        },
        assertions: [
          assertion(
            "response",
            6.321,
            "V",
            "6.321 V",
            0.0005,
            0,
            "approximately-equals"
          )
        ]
      },
      {
        displayFingerprint: "fnv1a32:0c99e656",
        inputs: {
          finalValue: input(20, "K"),
          time: input(10, "s", 0),
          timeConstant: input(5, "s", 1e-12)
        },
        assertions: [
          assertion(
            "response",
            17.29,
            "K",
            "17.29 K",
            0.005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  ),
  mean: defineFamily("mean", "arithmetic mean of all readings", [
    {
      displayFingerprint: "fnv1a32:796766b6",
      inputs: {
        a: input(2, "V"),
        b: input(4, "V"),
        c: input(6, "V")
      },
      assertions: [
        assertion("mean", 4, "V", "4 V")
      ]
    },
    {
      displayFingerprint: "fnv1a32:7ec07d3c",
      inputs: {
        a: input(8, "s"),
        b: input(9, "s"),
        c: input(10, "s"),
        d: input(13, "s")
      },
      assertions: [
        assertion("mean", 10, "s", "10 s")
      ]
    }
  ]),
  oscillation: defineFamily(
    "oscillation",
    "natural frequency = sqrt(stiffness/mass)/(2*pi)",
    [
      {
        displayFingerprint: "fnv1a32:d6139025",
        inputs: {
          stiffness: input(100, "N/m", 1e-12),
          mass: input(1, "kg", 1e-12)
        },
        assertions: [
          assertion(
            "naturalFrequency",
            1.592,
            "Hz",
            "1.592 Hz",
            0.0005,
            0,
            "approximately-equals"
          )
        ]
      },
      {
        displayFingerprint: "fnv1a32:f03e5def",
        inputs: {
          stiffness: input(400, "N/m", 1e-12),
          mass: input(4, "kg", 1e-12)
        },
        assertions: [
          assertion(
            "naturalFrequency",
            1.592,
            "Hz",
            "1.592 Hz",
            0.0005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  ),
  coulomb: defineFamily("coulomb", "force = k*abs(q1*q2)/separation^2", [
    {
      displayFingerprint: "fnv1a32:cc71dc1d",
      inputs: {
        coulombConstant: input(8.9875e9, "N m^2/C^2", 1e-12),
        chargeOne: input(1e-6, "C"),
        chargeTwo: input(1e-6, "C"),
        separation: input(0.1, "m", 1e-12)
      },
      assertions: [
        assertion(
          "forceMagnitude",
          0.8988,
          "N",
          "0.8988 N",
          0.00005,
          0,
          "approximately-equals"
        )
      ]
    },
    {
      displayFingerprint: "fnv1a32:22448dd4",
      inputs: {
        coulombConstant: input(8.9875e9, "N m^2/C^2", 1e-12),
        chargeOne: input(2e-6, "C"),
        chargeTwo: input(1e-6, "C"),
        separation: input(0.2, "m", 1e-12)
      },
      assertions: [
        assertion(
          "forceMagnitude",
          0.4494,
          "N",
          "0.4494 N",
          0.00005,
          0,
          "approximately-equals"
        )
      ]
    }
  ]),
  heatConduction: defineFamily(
    "heatConduction",
    "heat rate = conductivity*area*temperature difference/thickness",
    [
      {
      displayFingerprint: "fnv1a32:55be6bb6",
        inputs: {
          conductivity: input(200, "W/(m K)", 0),
          area: input(0.001, "m^2", 0),
          temperatureDifference: input(10, "K"),
          thickness: input(0.01, "m", 1e-12)
        },
        assertions: [
          assertion("heatRate", 200, "W", "200 W")
        ]
      },
      {
      displayFingerprint: "fnv1a32:03fae710",
        inputs: {
          conductivity: input(0.04, "W/(m K)", 0),
          area: input(2, "m^2", 0),
          temperatureDifference: input(20, "K"),
          thickness: input(0.1, "m", 1e-12)
        },
        assertions: [
          assertion("heatRate", 16, "W", "16 W")
        ]
      }
    ]
  ),
  spring: defineFamily("spring", "force = stiffness * displacement", [
    {
      displayFingerprint: "fnv1a32:0fa188ec",
      inputs: {
        stiffness: input(500, "N/m", 0),
        displacement: input(0.02, "m")
      },
      assertions: [
        assertion("force", 10, "N", "10 N")
      ]
    },
    {
      displayFingerprint: "fnv1a32:aadc47ad",
      inputs: {
        force: input(30, "N"),
        displacement: input(0.05, "m", 1e-12)
      },
      assertions: [
        assertion("stiffness", 600, "N/m", "600 N/m")
      ]
    }
  ]),
  machiningSpeed: defineFamily(
    "machiningSpeed",
    "surface speed = pi*diameter*rpm/60",
    [
      {
      displayFingerprint: "fnv1a32:6ad7eaf2",
        inputs: {
          diameter: input(0.02, "m", 0),
          revolutionsPerMinute: input(1200, "rev/min", 0)
        },
        assertions: [
          assertion(
            "surfaceSpeed",
            1.257,
            "m/s",
            "1.257 m/s",
            0.0005,
            0,
            "approximately-equals"
          )
        ]
      },
      {
      displayFingerprint: "fnv1a32:c9719028",
        inputs: {
          diameter: input(0.05, "m", 0),
          revolutionsPerMinute: input(600, "rev/min", 0)
        },
        assertions: [
          assertion(
            "surfaceSpeed",
            1.571,
            "m/s",
            "1.571 m/s",
            0.0005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  ),
  rcCutoff: defineFamily(
    "rcCutoff",
    "cutoff frequency = 1/(2*pi*resistance*capacitance)",
    [
      {
        displayFingerprint: "fnv1a32:82002fee",
        inputs: {
          resistance: input(1000, "ohm", 1e-12),
          capacitance: input(1e-6, "F", 1e-18)
        },
        assertions: [
          assertion(
            "cutoffFrequency",
            159.15,
            "Hz",
            "159.15 Hz",
            0.005,
            0,
            "approximately-equals"
          )
        ]
      },
      {
        displayFingerprint: "fnv1a32:35cb824f",
        inputs: {
          resistance: input(10_000, "ohm", 1e-12),
          capacitance: input(100e-9, "F", 1e-18)
        },
        assertions: [
          assertion(
            "cutoffFrequency",
            159.15,
            "Hz",
            "159.15 Hz",
            0.005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  ),
  adcResolution: defineFamily(
    "adcResolution",
    "resolution = reference voltage / 2^bit count",
    [
      {
      displayFingerprint: "fnv1a32:1b265a71",
        inputs: {
          referenceVoltage: input(3.3, "V", 0),
          bitCount: input(12, "bit", 1, 52)
        },
        assertions: [
          assertion(
            "resolutionVolts",
            0.0008057,
            "V",
            "0.0008057 V",
            0.00000005,
            0,
            "approximately-equals"
          ),
          assertion(
            "resolutionMillivolts",
            0.8057,
            "mV",
            "0.8057 mV",
            0.00005,
            0,
            "approximately-equals"
          )
        ]
      },
      {
      displayFingerprint: "fnv1a32:d99e2a7a",
        inputs: {
          referenceVoltage: input(5, "V", 0),
          bitCount: input(8, "bit", 1, 52)
        },
        assertions: [
          assertion(
            "resolutionVolts",
            0.01953,
            "V",
            "0.01953 V",
            0.000005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  ),
  pwmDuty: defineFamily("pwmDuty", "duty ratio = on time / period", [
    {
      displayFingerprint: "fnv1a32:f274c7d2",
      inputs: {
        onTime: input(2, "ms", 0),
        period: input(10, "ms", 1e-12)
      },
      assertions: [
        assertion("dutyRatio", 0.2, "1", "0.20"),
        assertion("dutyPercent", 20, "percent", "20 percent")
      ]
    },
    {
      displayFingerprint: "fnv1a32:e6144802",
      inputs: {
        frequencyKilohertz: input(1, "kHz", 1e-12),
        onTimeMilliseconds: input(0.75, "ms", 0)
      },
      assertions: [
        assertion(
          "periodMilliseconds",
          1,
          "ms",
          "T = 1/f = 1 ms"
        ),
        assertion("dutyRatio", 0.75, "1", "0.75"),
        assertion("dutyPercent", 75, "percent", "75 percent")
      ]
    }
  ]),
  fourier: defineFamily("fourier", "DC coefficient = sum of samples", [
    {
      displayFingerprint: "fnv1a32:78f2b567",
      inputs: {
        sampleZero: input(1, "V"),
        sampleOne: input(2, "V"),
        sampleTwo: input(1, "V"),
        sampleThree: input(0, "V")
      },
      assertions: [
        assertion("dcCoefficient", 4, "V", "4 V")
      ]
    },
    {
      displayFingerprint: "fnv1a32:a42a02ed",
      inputs: {
        sampleZero: input(2, "V"),
        sampleOne: input(2, "V"),
        sampleTwo: input(2, "V"),
        sampleThree: input(2, "V")
      },
      assertions: [
        assertion("dcCoefficient", 8, "V", "8 V")
      ]
    }
  ]),
  stateSpace: defineFamily(
    "stateSpace",
    "state derivative = A*state + B*input",
    [
      {
        displayFingerprint: "fnv1a32:bf1abbb7",
        inputs: {
          stateCoefficient: input(-2, "1/s"),
          state: input(1, "1"),
          inputCoefficient: input(3, "1/s"),
          input: input(2, "1")
        },
        assertions: [
          assertion("stateDerivative", 4, "1/s", "4 per second")
        ]
      },
      {
        displayFingerprint: "fnv1a32:5a9bba38",
        inputs: {
          stateCoefficient: {
            ...input(-1, "1/s"),
            displayedValueRequired: false,
            displayBindingMode: "implicit-coefficient",
            displayOmissionReason: "The displayed -x term carries the implicit coefficient -1 per second."
          },
          state: input(4, "1"),
          inputCoefficient: input(2, "1/s"),
          input: input(1, "1")
        },
        assertions: [
          assertion("stateDerivative", -2, "1/s", "-2 per second")
        ]
      }
    ]
  ),
  rigidTransform: defineFamily(
    "rigidTransform",
    "rotated x = x*cos(angle) - y*sin(angle)",
    [
      {
        displayFingerprint: "fnv1a32:964ac49c",
        inputs: {
          x: input(2, "m"),
          y: input(0, "m"),
          angleDegrees: input(60, "deg")
        },
        assertions: [
          assertion("rotatedX", 1, "m", "1 m", 1e-12)
        ]
      },
      {
        displayFingerprint: "fnv1a32:ffc13ad0",
        inputs: {
          x: input(0, "m"),
          y: input(3, "m"),
          angleDegrees: input(90, "deg")
        },
        assertions: [
          assertion("rotatedX", -3, "m", "-3 m", 1e-12)
        ]
      }
    ]
  ),
  jacobian: defineFamily("jacobian", "task velocity = Jacobian * joint rate", [
    {
      displayFingerprint: "fnv1a32:b7dc12fc",
      inputs: {
        jacobian: input(0.5, "m/rad"),
        jointRate: input(2, "rad/s")
      },
      assertions: [
        assertion("taskVelocity", 1, "m/s", "1.0 m/s")
      ]
    },
    {
      displayFingerprint: "fnv1a32:7c3e0a07",
      inputs: {
        jacobian: input(-0.2, "m/rad"),
        jointRate: input(3, "rad/s")
      },
      assertions: [
        assertion("taskVelocity", -0.6, "m/s", "-0.6 m/s")
      ]
    }
  ]),
  inertia: defineFamily("inertia", "rotational inertia = mass * radius^2", [
    {
      displayFingerprint: "fnv1a32:4102f5eb",
      inputs: {
        mass: input(2, "kg", 0),
        radius: input(0.3, "m", 0)
      },
      assertions: [
        assertion("inertia", 0.18, "kg m^2", "0.18 kg m^2")
      ]
    },
    {
      displayFingerprint: "fnv1a32:3e6e0b02",
      inputs: {
        mass: input(0.5, "kg", 0),
        radius: input(0.2, "m", 0)
      },
      assertions: [
        assertion("inertia", 0.02, "kg m^2", "0.020 kg m^2")
      ]
    }
  ]),
  bayes: defineFamily("bayes", "posterior probability from prior and likelihoods", [
    {
      displayFingerprint: "fnv1a32:293a8fee",
      inputs: {
        prior: input(0.2, "1", 0, 1),
        sensitivity: input(0.9, "1", 0, 1),
        falsePositiveRate: input(0.1, "1", 0, 1)
      },
      assertions: [
        assertion(
          "posterior",
          0.6923,
          "1",
          "0.6923",
          0.00005,
          0,
          "approximately-equals"
        )
      ]
    },
    {
      displayFingerprint: "fnv1a32:93172743",
      inputs: {
        prior: input(0.01, "1", 0, 1),
        sensitivity: input(0.95, "1", 0, 1),
        falsePositiveRate: input(0.05, "1", 0, 1)
      },
      assertions: [
        assertion(
          "posterior",
          0.161,
          "1",
          "0.1610",
          0.00005,
          0,
          "approximately-equals"
        )
      ]
    }
  ]),
  pathCost: defineFamily("pathCost", "total cost = accumulated + heuristic", [
    {
      displayFingerprint: "fnv1a32:a53c53db",
      inputs: {
        accumulatedCost: input(12, "m", 0),
        heuristicCost: input(5, "m", 0)
      },
      assertions: [
        assertion("totalCost", 17, "m", "17 m")
      ]
    },
    {
      displayFingerprint: "fnv1a32:65314f15",
      inputs: {
        accumulatedCost: input(8, "1", 0),
        heuristicCost: input(6, "1", 0)
      },
      assertions: [
        assertion("totalCost", 14, "1", "f = 14")
      ]
    }
  ]),
  neuron: defineFamily("neuron", "affine output = weighted features + bias", [
    {
      displayFingerprint: "fnv1a32:2824591c",
      inputs: {
        featureOne: input(2, "1"),
        featureTwo: input(1, "1"),
        weightOne: input(0.5, "1"),
        weightTwo: input(0.2, "1"),
        bias: input(0.7, "1")
      },
      assertions: [
        assertion("affineOutput", 1.9, "1", "z = 1.9")
      ]
    },
    {
      displayFingerprint: "fnv1a32:2b7391ff",
      inputs: {
        featureOne: input(1, "1"),
        featureTwo: input(-2, "1"),
        weightOne: input(3, "1"),
        weightTwo: input(0.5, "1"),
        bias: input(-1, "1")
      },
      assertions: [
        assertion("affineOutput", 1, "1", "z = 1")
      ]
    }
  ]),
  gradientDescent: defineFamily(
    "gradientDescent",
    "updated parameter = parameter - learning rate * gradient",
    [
      {
        displayFingerprint: "fnv1a32:36c4604a",
        inputs: {
          parameter: input(4, "1"),
          learningRate: input(0.1, "1", 0),
          gradient: input(6, "1")
        },
        assertions: [
          assertion("updatedParameter", 3.4, "1", "3.4")
        ]
      },
      {
        displayFingerprint: "fnv1a32:b341e539",
        inputs: {
          parameter: input(-1, "1"),
          learningRate: input(0.05, "1", 0),
          gradient: input(-4, "1")
        },
        assertions: [
          assertion("updatedParameter", -0.8, "1", "-0.8")
        ]
      }
    ]
  ),
  compression: defineFamily(
    "compression",
    "compression ratio = original size / compressed size",
    [
      {
        displayFingerprint: "fnv1a32:a2c8836e",
        inputs: {
          originalSize: input(20, "MB", 0),
          compressedSize: input(5, "MB", 1e-12)
        },
        assertions: [
          assertion("compressionRatio", 4, "1", "C = 4")
        ]
      },
      {
        displayFingerprint: "fnv1a32:b22e4c2d",
        inputs: {
          originalSize: input(120, "MB", 0),
          compressedSize: input(80, "MB", 1e-12)
        },
        assertions: [
          assertion("compressionRatio", 1.5, "1", "C = 1.5")
        ]
      }
    ]
  ),
  tradeScore: defineFamily("tradeScore", "weighted sum of criterion scores", [
    {
      displayFingerprint: "fnv1a32:4478ee49",
      inputs: {
        scoreOne: input(8, "1"),
        scoreTwo: input(6, "1"),
        weightOne: input(0.6, "1", 0, 1),
        weightTwo: input(0.4, "1", 0, 1)
      },
      assertions: [
        assertion("weightedScore", 7.2, "1", "S = 7.2")
      ]
    },
    {
      displayFingerprint: "fnv1a32:12a7db9b",
      inputs: {
        scoreOne: input(4, "1"),
        scoreTwo: input(7, "1"),
        scoreThree: input(9, "1"),
        weightOne: input(0.2, "1", 0, 1),
        weightTwo: input(0.3, "1", 0, 1),
        weightThree: input(0.5, "1", 0, 1)
      },
      assertions: [
        assertion("weightedScore", 7.4, "1", "S = 7.4")
      ]
    }
  ]),
  riskScore: defineFamily("riskScore", "risk score = likelihood * consequence", [
    {
      displayFingerprint: "fnv1a32:de44baa1",
      inputs: {
        likelihoodRank: input(3, "rank", 0),
        consequenceRank: input(4, "rank", 0)
      },
      assertions: [
        assertion("riskScore", 12, "1", "R = 12")
      ]
    },
    {
      displayFingerprint: "fnv1a32:83aea3fb",
      inputs: {
        likelihoodRank: input(2, "rank", 0),
        consequenceRank: input(5, "rank", 0)
      },
      assertions: [
        assertion("riskScore", 10, "1", "R = 10")
      ]
    }
  ]),
  complexMagnitude: defineFamily(
    "complexMagnitude",
    "magnitude = sqrt(real^2 + imaginary^2)",
    [
      {
        displayFingerprint: "fnv1a32:4cd8165d",
        inputs: {
          real: input(3, "V"),
          imaginary: input(4, "V")
        },
        assertions: [
          assertion("magnitude", 5, "V", "5 V")
        ]
      },
      {
        displayFingerprint: "fnv1a32:baf7e3af",
        inputs: {
          real: input(-5, "ohm"),
          imaginary: input(12, "ohm")
        },
        assertions: [
          assertion("magnitude", 13, "ohm", "13 ohm")
        ]
      }
    ]
  ),
  toleranceStack: defineFamily(
    "toleranceStack",
    "worst-case tolerance = sum of tolerance magnitudes",
    [
      {
        displayFingerprint: "fnv1a32:02fb64d0",
        inputs: {
          toleranceOne: input(0.1, "mm", 0),
          toleranceTwo: input(0.2, "mm", 0),
          toleranceThree: input(0.05, "mm", 0)
        },
        assertions: [
          assertion("worstCaseTolerance", 0.35, "mm", "0.35 mm")
        ]
      },
      {
        displayFingerprint: "fnv1a32:355af860",
        inputs: {
          toleranceOne: input(0.25, "mm", 0),
          toleranceTwo: input(0.15, "mm", 0)
        },
        assertions: [
          assertion("worstCaseTolerance", 0.4, "mm", "0.40 mm")
        ]
      }
    ]
  ),
  probability: defineFamily(
    "probability",
    "probability = event count / total count",
    [
      {
        displayFingerprint: "fnv1a32:3b0a1329",
        inputs: {
          eventCount: input(8, "count", 0),
          totalCount: input(40, "trials", 1)
        },
        assertions: [
          assertion("probability", 0.2, "1", "0.20")
        ]
      },
      {
        displayFingerprint: "fnv1a32:46fdab74",
        inputs: {
          eventCount: input(3, "count", 0),
          totalCount: input(12, "outcomes", 1)
        },
        assertions: [
          assertion("probability", 0.25, "1", "0.25")
        ]
      }
    ]
  ),
  featureMatchRatio: defineFamily(
    "featureMatchRatio",
    "match ratio = nearest / second-nearest distance",
    [
      {
        displayFingerprint: "fnv1a32:b9503199",
        inputs: {
          nearestDistance: input(0.4, "1", 0),
          secondNearestDistance: input(0.8, "1", 1e-12)
        },
        assertions: [
          assertion("matchRatio", 0.5, "1", "0.50")
        ]
      },
      {
        displayFingerprint: "fnv1a32:c48e184a",
        inputs: {
          nearestDistance: input(30, "1", 0),
          secondNearestDistance: input(40, "1", 1e-12)
        },
        assertions: [
          assertion("matchRatio", 0.75, "1", "0.75")
        ]
      }
    ]
  ),
  transferMagnitude: defineFamily(
    "transferMagnitude",
    "transfer magnitude = output amplitude / input amplitude",
    [
      {
        displayFingerprint: "fnv1a32:5e638914",
        inputs: {
          outputAmplitude: input(2, "V", 0),
          inputAmplitude: input(5, "V", 1e-12)
        },
        assertions: [
          assertion("transferMagnitude", 0.4, "1", "0.40")
        ]
      },
      {
        displayFingerprint: "fnv1a32:bb1a8669",
        inputs: {
          outputAmplitude: input(0.1, "m", 0),
          inputAmplitude: input(0.2, "m", 1e-12)
        },
        assertions: [
          assertion("transferMagnitude", 0.5, "1", "0.50")
        ]
      }
    ]
  ),
  pid: defineFamily("pid", "PID command is sum of P, I and D terms", [
    {
      displayFingerprint: "fnv1a32:0e4ad2c0",
      inputs: {
        proportionalGain: input(2, "1"),
        integralGain: input(0.5, "1"),
        derivativeGain: input(0.1, "1"),
        error: input(1, "1"),
        integralError: input(2, "1"),
        errorRate: input(3, "1")
      },
      assertions: [
        assertion("command", 3.3, "actuator unit", "3.3 actuator units")
      ]
    },
    {
      displayFingerprint: "fnv1a32:9dc8d09f",
      inputs: {
        proportionalGain: input(1.5, "1"),
        integralGain: input(0.2, "1"),
        derivativeGain: input(0, "1"),
        error: input(2, "1"),
        integralError: input(5, "1")
      },
      assertions: [
        assertion("command", 4, "actuator unit", "4 actuator units")
      ]
    }
  ]),
  reliability: defineFamily(
    "reliability",
    "series reliability = product of component reliabilities",
    [
      {
        displayFingerprint: "fnv1a32:8fac8864",
        inputs: {
          reliabilityOne: input(0.95, "1", 0, 1),
          reliabilityTwo: input(0.95, "1", 0, 1)
        },
        assertions: [
          assertion("reliability", 0.9025, "1", "0.9025")
        ]
      },
      {
        displayFingerprint: "fnv1a32:52543fde",
        inputs: {
          reliabilityOne: input(0.99, "1", 0, 1),
          reliabilityTwo: input(0.98, "1", 0, 1),
          reliabilityThree: input(0.97, "1", 0, 1)
        },
        assertions: [
          assertion(
            "reliability",
            0.9411,
            "1",
            "0.9411",
            0.00005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  ),
  diodeShockley: defineFamily(
    "diodeShockley",
    "diode current follows the reviewed Shockley relation",
    [
      {
        displayFingerprint: "fnv1a32:ae63f8b2",
        inputs: {
          saturationCurrentNanoamps: input(1, "nA", 1e-12),
          idealityFactor: input(2, "1", 1e-12),
          thermalVoltage: input(0.025, "V", 1e-12),
          junctionVoltage: input(0.5, "V")
        },
        assertions: [
          assertion(
            "diodeCurrent",
            0.022,
            "mA",
            "0.0220 mA",
            0.00005,
            0,
            "approximately-equals"
          )
        ]
      },
      {
        displayFingerprint: "fnv1a32:081b36bf",
        inputs: {
          saturationCurrentNanoamps: input(1, "nA", 1e-12),
          idealityFactor: input(2, "1", 1e-12),
          thermalVoltage: input(0.025, "V", 1e-12),
          junctionVoltage: input(0.6, "V")
        },
        assertions: [
          assertion(
            "diodeCurrent",
            0.1628,
            "mA",
            "0.1628 mA",
            0.00005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  ),
  kalmanUpdate: defineFamily(
    "kalmanUpdate",
    "scalar Kalman gain, state update and covariance update",
    [
      {
        displayFingerprint: "fnv1a32:ed4b09ec",
        inputs: {
          predictedState: input(2, "m"),
          predictedVariance: input(4, "m^2", 0),
          measurement: input(3, "m"),
          measurementVariance: input(1, "m^2", 1e-12)
        },
        assertions: [
          assertion("gain", 0.8, "1", "K = 4.0/(4.0 + 1.0) = 0.80"),
          assertion("posteriorState", 2.8, "m", "x posterior = 2.8 m"),
          assertion(
            "posteriorVariance",
            0.8,
            "m^2",
            "P posterior = 0.8 m^2"
          )
        ]
      },
      {
        displayFingerprint: "fnv1a32:7089c24b",
        inputs: {
          predictedState: input(10, "deg"),
          predictedVariance: input(1, "deg^2", 0),
          measurement: input(14, "deg"),
          measurementVariance: input(3, "deg^2", 1e-12)
        },
        assertions: [
          assertion("gain", 0.25, "1", "K = 1/(1 + 3) = 0.25"),
          assertion("posteriorState", 11, "deg", "x posterior = 11 deg"),
          assertion(
            "posteriorVariance",
            0.75,
            "deg^2",
            "P posterior = 0.75 deg^2"
          )
        ]
      }
    ]
  ),
  extendedKalmanUpdate: defineFamily(
    "extendedKalmanUpdate",
    "EKF update for observation h(x) = x^2",
    [
      {
        displayFingerprint: "fnv1a32:26402450",
        inputs: {
          predictedState: input(2, "m"),
          predictedVariance: input(0.25, "m^2", 0),
          measurement: input(5, "m^2"),
          measurementVariance: input(1, "m^4", 1e-12)
        },
        assertions: [
          assertion("observationJacobian", 4, "m", "H = 2 x 2.0 = 4.0 m"),
          assertion(
            "innovationCovariance",
            5,
            "m^4",
            "S = 4^2 x 0.25 + 1.0 = 5.0 m^4"
          ),
          assertion("gain", 0.2, "1/m", "gain 0.20 per metre"),
          assertion("posteriorState", 2.2, "m", "x posterior = 2.2 m")
        ]
      },
      {
        displayFingerprint: "fnv1a32:aa5434ee",
        inputs: {
          predictedState: input(3, "m"),
          predictedVariance: input(0.16, "m^2", 0),
          measurement: input(8.5, "m^2"),
          measurementVariance: input(0.36, "m^4", 1e-12)
        },
        assertions: [
          assertion("observationJacobian", 6, "m", "H = 6.0 m"),
          assertion("innovationCovariance", 6.12, "m^4", "= 6.12 m^4"),
          assertion(
            "gain",
            0.1569,
            "1/m",
            "K = 0.1569 per metre",
            0.00005,
            0,
            "approximately-equals"
          ),
          assertion(
            "posteriorState",
            2.922,
            "m",
            "x posterior = 2.922 m",
            0.0005,
            0,
            "approximately-equals"
          )
        ]
      }
    ]
  )
} satisfies WorkedExampleFamilyRegistry;

export const quantitativeFormulaSequenceByUnit = {
  "EML-E0-D01": [null, null, null, null, "ratio", null, null],
  "EML-E0-D02": ["sum", "ratio", null, "stress", "ratio", "uncertainty", "linear"],
  "EML-E0-D03": [
    "linear",
    "linear",
    "derivative",
    "vector",
    "vector",
    "rigidTransform",
    "complexMagnitude"
  ],
  "EML-E1-D04": [
    "derivative",
    "integral",
    "partialSensitivity",
    "firstOrderStep",
    "eigen",
    "inverseDerivative",
    "mean"
  ],
  "EML-E1-D05": [
    "force",
    "force",
    "power",
    "oscillation",
    "coulomb",
    "heatConduction",
    "stress"
  ],
  "EML-E1-D06": [null, null, null, null, null, "timing", null],
  "EML-E1-D07": [null, null, null, null, null, null, "timing"],
  "EML-E1-D08": [null, null, null, "toleranceStack", null, null, "stress"],
  "EML-E2-D09": [null, "stress", "stress", "power", "spring", "power", null],
  "EML-E2-D10": [null, "machiningSpeed", null, null, null, null, null],
  "EML-E2-D11": [
    "ohm",
    "ohm",
    "rcCutoff",
    "diodeShockley",
    "linear",
    null,
    "power"
  ],
  "EML-E2-D12": ["linear", "linear", "linear", "adcResolution", null, null, "linear"],
  "EML-E2-D13": [null, "ohm", "pwmDuty", "adcResolution", null, "timing", null],
  "EML-E2-D14": ["ohm", "timing", "timing", null, "timing", "timing", "timing"],
  "EML-E2-D15": [null, null, "sampling", "rcCutoff", "fourier", "stateSpace", "linear"],
  "EML-E2-D16": [
    "firstOrderStep",
    "control",
    null,
    "pid",
    "transferMagnitude",
    "estimate",
    "pid"
  ],
  "EML-E3-D17": [
    null,
    "rigidTransform",
    "rigidTransform",
    "jacobian",
    "force",
    "power",
    "robot"
  ],
  "EML-E3-D18": [null, "timing", "timing", "inertia", "timing", "robot", "timing"],
  "EML-E3-D19": [
    "probability",
    "bayes",
    "uncertainty",
    "estimate",
    "kalmanUpdate",
    "extendedKalmanUpdate",
    null
  ],
  "EML-E3-D20": ["robot", "estimate", null, null, "pathCost", "derivative", "ratio"],
  "EML-E3-D21": [
    "pinhole",
    null,
    "pinhole",
    "rigidTransform",
    "featureMatchRatio",
    "pinhole",
    "metric"
  ],
  "EML-E3-D22": ["ratio", "linear", "metric", null, "metric", null, "mean"],
  "EML-E3-D23": ["neuron", "gradientDescent", "metric", null, null, "compression", null],
  "EML-E4-D24": [null, null, "tradeScore", "riskScore", "reliability", "ratio", null],
  "EML-E4-D25": ["sum", null, null, null, null, null, null]
} as const satisfies Readonly<
  Record<string, readonly (keyof typeof workedExampleVerificationFamilies | null)[]>
>;

export const quantitativeLessonFormulaAssignments =
  Object.entries(quantitativeFormulaSequenceByUnit).flatMap(
    ([unitId, formulaSequence]): QuantitativeLessonFormulaAssignment[] =>
      formulaSequence.flatMap((familyId, lessonIndex) =>
        familyId === null
          ? []
          : [{
              lessonId: `${unitId}-L${String(lessonIndex + 1).padStart(2, "0")}`,
              familyId
            }]
      )
  );

export const workedExampleVerificationInstances =
  expandWorkedExampleVerificationInstances(
    workedExampleVerificationFamilies,
    quantitativeLessonFormulaAssignments
  );

export const workedExampleVerificationQualityManifest =
  buildWorkedExampleVerificationQualityManifest(
    workedExampleVerificationFamilies,
    quantitativeLessonFormulaAssignments
  );
