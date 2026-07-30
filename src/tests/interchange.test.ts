import { describe, expect, it } from "vitest";
import {
  AdapterEcosystemDescriptor,
  ProjectPack,
  ProjectPackSource,
  createDeterministicFixtureResult,
  createEngineeringReportInput,
  createProjectPack,
  discoverAdapterCapabilities,
  exportProjectPack,
  generateEngineeringReports,
  importProjectPack,
  planAdapterExecution,
  resolveProjectPackCatalogue,
  settleAdapterExecution
} from "../lib/interchange";

function source(overrides: Partial<ProjectPackSource> = {}): ProjectPackSource {
  return {
    packId: "motor-sizing-foundations",
    packVersion: "1.0.0",
    generatedUtc: "2026-07-28T00:00:00.000Z",
    compatibility: {
      kernelSchemaMinimum: 2,
      kernelSchemaMaximum: 2,
      applicationVersionRange: ">=0.2.0 <1.0.0"
    },
    content: {
      learningSequence: [
        {
          id: "learn-load",
          title: "Define the load case",
          objective: "Record continuous and peak requirements before calculating.",
          projectStage: "learn"
        },
        {
          id: "prove-selection",
          title: "Prove the sizing result",
          objective: "Retain assumptions, equations, results and validation evidence.",
          projectStage: "prove"
        }
      ],
      project: {
        version: 2,
        id: "motor-sizing",
        name: "Motor sizing study",
        description: "A deterministic motor sizing evidence slice without product selection.",
        revision: 0,
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
        variables: [
          {
            version: 1,
            id: "shaft-speed",
            label: "Shaft speed",
            role: "input",
            dimension: "angular-speed",
            value: 1_000,
            baseValue: 1_000 * (2 * Math.PI / 60),
            unitId: "rpm",
            validRange: { minimumBase: 0 },
            validation: { status: "valid", messages: [] },
            provenance: { kind: "manual" },
            assumptionStatus: "specified",
            createdAt: "2026-07-28T00:00:00.000Z",
            updatedAt: "2026-07-28T00:00:00.000Z"
          },
          {
            version: 1,
            id: "shaft-torque",
            label: "Shaft torque",
            role: "input",
            dimension: "torque",
            value: 2,
            baseValue: 2,
            unitId: "N.m",
            validRange: { minimumBase: 0 },
            validation: { status: "valid", messages: [] },
            provenance: { kind: "manual" },
            assumptionStatus: "specified",
            createdAt: "2026-07-28T00:00:00.000Z",
            updatedAt: "2026-07-28T00:00:00.000Z"
          },
          {
            version: 1,
            id: "shaft-power",
            label: "Shaft power",
            role: "derived",
            dimension: "power",
            value: 209.43951023931953,
            baseValue: 209.43951023931953,
            unitId: "W",
            validRange: { minimumBase: 0 },
            validation: { status: "valid", messages: [] },
            provenance: { kind: "calculation", referenceId: "shaft-power-model" },
            assumptionStatus: "derived",
            createdAt: "2026-07-28T00:00:00.000Z",
            updatedAt: "2026-07-28T00:00:00.000Z",
            calculationVersionRef: {
              calculationId: "shaft-power-model",
              algorithmId: "motor-power",
              algorithmVersion: "1.0.0"
            }
          }
        ],
        calculations: [
          {
            version: 1,
            id: "shaft-power-model",
            label: "Shaft power",
            equation: "omega = 2 * pi * rpm / 60; P = torque * omega",
            algorithmId: "motor-power",
            algorithmVersion: "1.0.0",
            inputs: [
              {
                variableId: "shaft-speed",
                value: 1_000,
                baseValue: 1_000 * (2 * Math.PI / 60),
                unitId: "rpm",
                dimension: "angular-speed"
              },
              {
                variableId: "shaft-torque",
                value: 2,
                baseValue: 2,
                unitId: "N.m",
                dimension: "torque"
              }
            ],
            outputs: [
              {
                variableId: "shaft-power",
                value: 209.43951023931953,
                baseValue: 209.43951023931953,
                unitId: "W",
                dimension: "power"
              }
            ],
            assumptions: ["Torque and speed are expressed at the same shaft."],
            warnings: [],
            boundaries: ["This calculation does not select a motor product."],
            sourceDatasetId: "load-profile",
            scenarioId: "baseline",
            recordedAt: "2026-07-28T00:00:00.000Z",
            evidenceIds: [],
            projectId: "motor-sizing"
          }
        ],
        datasets: [
          {
            version: 1,
            id: "load-profile",
            name: "Load profile",
            source: "manual",
            provenance: {
              sourceLabel: "Engineering Mastery Lab deterministic test fixture",
              licenceId: "MIT",
              learnerGenerated: false
            },
            columns: [
              { id: "time", label: "Time", type: "number", unitId: "s" },
              { id: "torque", label: "Torque", type: "number", unitId: "N.m" }
            ],
            rows: [
              { time: 0, torque: 2 },
              { time: 1, torque: 3 }
            ]
          }
        ],
        scenarioSet: {
          version: 1,
          baselineId: "baseline",
          scenarios: [
            {
              version: 1,
              id: "baseline",
              name: "Baseline",
              kind: "baseline",
              overrides: {}
            },
            {
              version: 1,
              id: "peak",
              name: "Peak speed",
              kind: "named",
              overrides: {
                "shaft-speed": { value: 1_200, unitId: "rpm" }
              }
            }
          ]
        },
        notebook: {
          version: 1,
          blocks: [
            {
              version: 1,
              id: "project-context",
              kind: "note",
              text: "State the duty cycle and evidence boundary."
            }
          ]
        },
        evidenceGraph: { version: 1, nodes: [], edges: [] }
      },
      discipline: "multidisciplinary mechatronics",
      datasetFixtures: [
        {
          version: 1,
          id: "load-profile",
          name: "Load profile",
          source: "manual",
          provenance: {
            sourceLabel: "Engineering Mastery Lab deterministic test fixture",
            licenceId: "MIT",
            learnerGenerated: false
          },
          columns: [
            { id: "time", label: "Time", type: "number", unitId: "s" },
            { id: "torque", label: "Torque", type: "number", unitId: "N.m" }
          ],
          rows: [
            { time: 0, torque: 2 },
            { time: 1, torque: 3 }
          ]
        }
      ],
      notebookTemplates: [
        {
          id: "sizing-notebook",
          title: "Sizing notebook",
          notebook: {
            version: 1,
            blocks: [
              {
                version: 1,
                id: "context",
                kind: "note",
                text: "State the duty cycle and evidence boundary."
              },
              {
                version: 1,
                id: "calculation",
                kind: "calculation",
                text: "Evaluate the power relation.",
                referenceId: "shaft-power-model"
              }
            ]
          }
        }
      ],
      evidenceRubric: {
        version: 1,
        criteria: [
          {
            id: "inputs",
            title: "Inputs",
            requirement: "Inputs include units, role and provenance.",
            weight: 0.5
          },
          {
            id: "reproduction",
            title: "Reproduction",
            requirement: "The same project state reproduces identical report bytes.",
            weight: 0.5
          }
        ]
      },
      reports: [
        {
          id: "evidence-template",
          title: "Evidence report template",
          format: "markdown",
          body: "# Evidence report\n\nRecord the result and its limits.\n"
        },
        {
          id: "machine-template",
          title: "Machine report template",
          format: "json",
          body: "{\"status\":\"template\"}"
        }
      ],
      licence: {
        spdxId: "MIT",
        name: "MIT License",
        text: "MIT License\n\nPermission is hereby granted for this project pack fixture."
      },
      provenance: {
        source: "Engineering Mastery Lab deterministic local fixture",
        author: "Engineering Mastery Lab",
        createdUtc: "2026-07-28T00:00:00.000Z",
        licenceIds: ["MIT"]
      }
    },
    ...overrides
  };
}

function pack(): ProjectPack {
  return createProjectPack(source());
}

function sourceWithMixedIdentifierOrder(identifierOrder: string[]): ProjectPackSource {
  const candidate = source();
  const ordinalValues = new Map(
    ["A", "Z", "a", "a-a", "a.a", "a:a", "aA", "a_a", "aa", "z"]
      .map((id, index) => [id, index + 1])
  );
  const torqueTemplate = candidate.content.project.variables.find(
    (variable) => variable.id === "shaft-torque"
  );
  if (!torqueTemplate) throw new Error("Shaft torque fixture is missing");
  candidate.content.project.variables.push(...identifierOrder.map((id) => ({
    ...torqueTemplate,
    id,
    label: `Ordinal input ${id}`
  })));
  candidate.content.project.scenarioSet.scenarios.push({
    version: 1,
    id: "mixed-identifier-order",
    name: "Mixed identifier order",
    kind: "named",
    overrides: Object.fromEntries(identifierOrder.map((id) => [
      id,
      { value: ordinalValues.get(id) ?? 0, unitId: "N.m" }
    ]))
  });
  return candidate;
}

function externalDescriptor(
  availability: AdapterEcosystemDescriptor["availability"] = {
    state: "missing",
    reason: "ngspice was not detected.",
    remediation: "Install ngspice or configure its executable in Settings."
  }
): AdapterEcosystemDescriptor {
  return {
    schemaVersion: 1,
    adapterId: "ngspice",
    adapterVersion: "1.0.0",
    kind: "external",
    availability,
    capabilities: [
      {
        id: "ngspice.transient",
        title: "Transient analysis",
        description: "Run a bounded transient circuit analysis.",
        inputSchemaVersion: 1,
        outputSchemaVersion: 1,
        deterministicFixtureId: "rc-transient-v1"
      }
    ],
    executionPolicy: {
      minimumTimeoutMs: 100,
      maximumTimeoutMs: 30_000,
      maximumOutputBytes: 1_000_000,
      cancellation: "cooperative"
    }
  };
}

describe("versioned project packs", () => {
  it("exports and imports deterministic content with a complete hashed manifest", () => {
    const first = pack();
    const second = pack();
    expect(exportProjectPack(first)).toBe(exportProjectPack(second));
    const imported = importProjectPack(exportProjectPack(first));
    expect(imported).toEqual(first);
    expect(imported.manifest.entries.map((entry) => entry.path)).toEqual([
      "datasets/load-profile.json",
      "evidence/rubric.json",
      "kernel/calculations.json",
      "kernel/evidence-graph.json",
      "kernel/scenarios.json",
      "kernel/variables.json",
      "learning/sequence.json",
      "licence/LICENCE.txt",
      "licence/metadata.json",
      "notebooks/sizing-notebook.json",
      "project/project.json",
      "provenance/provenance.json",
      "reports/evidence-template.md",
      "reports/machine-template.json"
    ]);
    expect(imported.manifest.entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true);
    expect(imported.integrity.contentSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("keeps Project Pack and report bytes stable for locale-sensitive identifier order", () => {
    const expectedOrdinalOrder = ["A", "Z", "a", "a-a", "a.a", "a:a", "aA", "a_a", "aa", "z"];
    const firstPack = createProjectPack(sourceWithMixedIdentifierOrder([
      "z", "aA", "aa", "a.a", "a:a", "a-a", "a_a", "A", "a", "Z"
    ]));
    const secondPack = createProjectPack(sourceWithMixedIdentifierOrder(
      [...expectedOrdinalOrder].reverse()
    ));
    const firstBytes = exportProjectPack(firstPack);
    const secondBytes = exportProjectPack(secondPack);
    expect(secondBytes).toBe(firstBytes);
    expect(firstPack.integrity.contentSha256).toBe(secondPack.integrity.contentSha256);
    expect(firstPack.integrity.contentSha256).toMatch(/^[a-f0-9]{64}$/);

    const mixedIds = new Set(expectedOrdinalOrder);
    expect(
      firstPack.content.project.variables
        .map((variable) => variable.id)
        .filter((id) => mixedIds.has(id))
    ).toEqual(expectedOrdinalOrder);
    expect(Object.keys(
      firstPack.content.project.scenarioSet.scenarios.find(
        (scenario) => scenario.id === "mixed-identifier-order"
      )?.overrides ?? {}
    )).toEqual(expectedOrdinalOrder);

    const reportOptions = {
      generatedUtc: "2026-07-28T01:00:00.000Z",
      scenarioId: "mixed-identifier-order",
      numericTolerance: 1e-9,
      tolerances: [],
      results: [],
      charts: [],
      validation: ["Ordinal identifier ordering verified."],
      warnings: [],
      limits: [],
      lineage: [],
      environment: { application: "0.2.0" }
    };
    const firstReports = generateEngineeringReports(
      createEngineeringReportInput(firstPack, reportOptions)
    );
    const secondReports = generateEngineeringReports(
      createEngineeringReportInput(secondPack, reportOptions)
    );
    expect(secondReports).toEqual(firstReports);
    expect(secondReports.integrity.markdownSha256).toBe(firstReports.integrity.markdownSha256);
    expect(secondReports.integrity.jsonSha256).toBe(firstReports.integrity.jsonSha256);
  });

  it("rejects traversal, absolute, backslash, reserved and ADS manifest paths", () => {
    for (const unsafePath of [
      "../escape.json",
      "/absolute.json",
      "C:/absolute.json",
      "folder\\file.json",
      "results/con.json",
      "results/file.json:stream"
    ]) {
      const value = structuredClone(pack()) as ProjectPack;
      value.manifest.entries[0].path = unsafePath;
      expect(
        () => importProjectPack(JSON.stringify(value)),
        unsafePath
      ).toThrow(/Unsafe workspace-relative path|Unexpected project pack content type/);
    }
  });

  it("rejects executable paths, unexpected binary media and executable report content", () => {
    const executablePath = structuredClone(pack()) as ProjectPack;
    executablePath.manifest.entries[0].path = "datasets/payload.js";
    expect(() => importProjectPack(JSON.stringify(executablePath))).toThrow(/Executable project pack path/);

    const binary = structuredClone(pack()) as unknown as Record<string, unknown>;
    const manifest = binary.manifest as { entries: Array<Record<string, unknown>> };
    manifest.entries[0].path = "datasets/payload.bin";
    manifest.entries[0].mediaType = "application/octet-stream";
    expect(() => importProjectPack(JSON.stringify(binary))).toThrow(/Unexpected project pack content type/);

    const candidate = source();
    candidate.content.reports[0].body = "<script>alert('no')</script>";
    expect(() => createProjectPack(candidate)).toThrow(/executable content/);
  });

  it("rejects unsafe keys, unsupported schemas, oversize input and integrity tampering", () => {
    expect(() => importProjectPack('{"__proto__":{"polluted":true}}')).toThrow(/unsafe key/);

    const unsupported = structuredClone(pack()) as unknown as Record<string, unknown>;
    unsupported.schemaVersion = 2;
    expect(() => importProjectPack(JSON.stringify(unsupported))).toThrow(/Unsupported project pack schema/);

    expect(() => importProjectPack("x".repeat(2_000_001))).toThrow(/exceeds/);

    const tampered = structuredClone(pack()) as ProjectPack;
    tampered.content.project.name = "Tampered project";
    expect(() => importProjectPack(JSON.stringify(tampered))).toThrow(/manifest does not match/);
  });

  it("rejects duplicate stable ids unless a catalogue resolution selects one hash", () => {
    const duplicateVariable = source();
    duplicateVariable.content.project.variables.push(
      structuredClone(duplicateVariable.content.project.variables[0])
    );
    expect(() => createProjectPack(duplicateVariable)).toThrow(
      /duplicate id "shaft-speed" was found in variables/
    );

    const first = pack();
    const alternativeSource = source({
      packVersion: "1.1.0",
      generatedUtc: "2026-07-28T00:01:00.000Z"
    });
    const second = createProjectPack(alternativeSource);
    expect(() => resolveProjectPackCatalogue([first, second])).toThrow(/duplicate stable id/);
    expect(resolveProjectPackCatalogue(
      [first, second],
      { [first.packId]: second.integrity.contentSha256 }
    )).toEqual([second]);
  });
});

describe("deterministic engineering reports", () => {
  it("reproduces byte-for-byte after project pack export and import", () => {
    const options = {
      generatedUtc: "2026-07-28T01:00:00.000Z",
      scenarioId: "peak",
      numericTolerance: 1e-9,
      tolerances: ["Calculated power comparison uses absolute tolerance 1e-9 W."],
      results: [
        {
          id: "shaft-power",
          label: "Shaft power",
          value: 251.32741228718345,
          unitId: "W",
          status: "pass" as const
        }
      ],
      charts: [
        {
          id: "load-profile-table",
          title: "Load profile",
          columns: ["Time (s)", "Torque (N m)"],
          rows: [[0, 2], [1, 3]]
        }
      ],
      validation: ["Power was independently recomputed from torque and angular speed."],
      warnings: ["This workflow does not select a motor product."],
      limits: ["Thermal behaviour requires a separately validated model."],
      lineage: ["calculation:shaft-power-model"],
      environment: {
        application: "0.2.0",
        browser: "Chromium fixture",
        ngspice: "not installed"
      }
    };
    const originalPack = pack();
    const importedPack = importProjectPack(exportProjectPack(originalPack));
    const originalReport = generateEngineeringReports(
      createEngineeringReportInput(originalPack, options)
    );
    const importedReport = generateEngineeringReports(
      createEngineeringReportInput(importedPack, options)
    );
    expect(importedReport).toEqual(originalReport);
    expect(originalReport.markdown).toContain("Numeric comparison tolerance: 1e-9");
    expect(originalReport.markdown).toContain("### Chart data: Load profile");
    expect(originalReport.markdown).toContain("| Time \\(s\\) | Torque \\(N m\\) |");
    expect(originalReport.markdown).toContain("Project pack SHA-256");
    expect(originalReport.json).toContain('"siUnitId": "rad-per-s"');
    expect(originalReport.json).toContain('"displayUnitId": "rpm"');
    expect(originalReport.integrity.markdownSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("escapes active Markdown and remote URL syntax in generated reports", () => {
    const attack = [
      '<img src="https://example.invalid/pixel" onerror="alert(1)">',
      "![beacon](https://example.invalid/image)",
      "[remote](https://example.invalid/target)",
      "# injected heading",
      "| injected | table |"
    ].join("\n");
    const report = generateEngineeringReports(createEngineeringReportInput(pack(), {
      generatedUtc: "2026-07-28T01:00:00.000Z",
      scenarioId: "baseline",
      numericTolerance: 1e-9,
      tolerances: [attack],
      results: [{
        id: "adversarial-result",
        label: attack,
        value: 1,
        unitId: "one",
        status: "warning"
      }],
      charts: [{
        id: "adversarial-chart",
        title: attack,
        columns: [attack],
        rows: [[attack]]
      }],
      validation: [attack],
      warnings: [attack],
      limits: [attack],
      lineage: [attack],
      environment: { fixture: attack }
    }));

    expect(report.markdown).not.toMatch(/(^|[^\\])<\s*(?:img|script)\b/im);
    expect(report.markdown).not.toMatch(/(^|[^\\])!\[/m);
    expect(report.markdown).not.toMatch(/(^|[^\\])\[[^\]\n]+\]\(/m);
    expect(report.markdown).not.toMatch(/https?:\/\//i);
    expect(report.markdown).not.toMatch(/onerror\s*=/i);
    expect(report.markdown).not.toMatch(/^# injected heading$/m);
    expect(report.markdown).not.toContain("\n| injected | table |");
    expect(report.markdown).toContain("\\<img");
    expect(report.markdown).toContain("https\\:\\/\\/example\\.invalid");
  });

  it("rejects invalid report boundaries before generating output", () => {
    const baseOptions = {
      generatedUtc: "2026-07-28T01:00:00.000Z",
      scenarioId: "baseline",
      numericTolerance: 1e-9,
      tolerances: [],
      results: [],
      charts: [],
      validation: [],
      warnings: [],
      limits: [],
      lineage: [],
      environment: {}
    };
    expect(() => createEngineeringReportInput(pack(), {
      ...baseOptions,
      numericTolerance: 0
    })).toThrow(/must be positive/);
    expect(() => createEngineeringReportInput(pack(), {
      ...baseOptions,
      scenarioId: "missing"
    })).toThrow(/is not present/);
    expect(() => createEngineeringReportInput(pack(), {
      ...baseOptions,
      charts: [{ id: "bad", title: "Bad", columns: ["x", "y"], rows: [[1]] }]
    })).toThrow(/wrong number of cells/);
  });
});

describe("adapter ecosystem metadata", () => {
  it("discovers versioned capabilities and preserves honest missing-tool state", () => {
    const discovered = discoverAdapterCapabilities([externalDescriptor()]);
    expect(discovered).toHaveLength(1);
    expect(discovered[0].availability).toEqual({
      state: "missing",
      reason: "ngspice was not detected.",
      remediation: "Install ngspice or configure its executable in Settings."
    });
    const plan = planAdapterExecution(
      externalDescriptor(),
      "ngspice.transient",
      { stopTime: 0.01 },
      { timeoutMs: 5_000, cancellationRequested: false }
    );
    expect(plan.state).toBe("blocked-tool-missing");
    expect(plan.message).toMatch(/not detected/);
  });

  it("enforces bounded timeout and cancellation without executing a process", () => {
    const ready = externalDescriptor({ state: "ready", version: "42.0" });
    expect(() => planAdapterExecution(
      ready,
      "ngspice.transient",
      {},
      { timeoutMs: 30_001, cancellationRequested: false }
    )).toThrow(/from 100 to 30000/);
    const cancelled = planAdapterExecution(
      ready,
      "ngspice.transient",
      {},
      { timeoutMs: 1_000, cancellationRequested: true }
    );
    expect(cancelled.state).toBe("cancelled-before-start");
    const plan = planAdapterExecution(
      ready,
      "ngspice.transient",
      {},
      { timeoutMs: 1_000, cancellationRequested: false }
    );
    expect(settleAdapterExecution(plan, {
      elapsedMs: 1_001,
      cancellationRequested: false,
      adapterStatus: "ok"
    })).toBe("timeout");
    expect(settleAdapterExecution(plan, {
      elapsedMs: 500,
      cancellationRequested: true,
      adapterStatus: "ok"
    })).toBe("cancelled");
  });

  it("labels deterministic fixtures without promoting them to real tool runs", () => {
    const descriptor = externalDescriptor();
    const first = createDeterministicFixtureResult(
      descriptor,
      "ngspice.transient",
      "rc-transient-v1",
      { stopTime: 0.01 },
      { points: [[0, 0], [0.01, 5]] }
    );
    const second = createDeterministicFixtureResult(
      descriptor,
      "ngspice.transient",
      "rc-transient-v1",
      { stopTime: 0.01 },
      { points: [[0, 0], [0.01, 5]] }
    );
    expect(first).toEqual(second);
    expect(first.verificationBoundary).toBe("deterministic-fixture-only");
    expect(first.outputSha256).toMatch(/^[a-f0-9]{64}$/);
    const bounded = externalDescriptor();
    bounded.executionPolicy.maximumOutputBytes = 1_024;
    expect(() => createDeterministicFixtureResult(
      bounded,
      "ngspice.transient",
      "rc-transient-v1",
      {},
      { output: "x".repeat(1_024) }
    )).toThrow(/exceeds 1024 bytes/);
  });

  it("rejects duplicate adapter ids during capability discovery", () => {
    const duplicate = externalDescriptor();
    expect(() => discoverAdapterCapabilities([
      externalDescriptor(),
      duplicate
    ])).toThrow(/duplicate adapter id ngspice/);
  });
});
