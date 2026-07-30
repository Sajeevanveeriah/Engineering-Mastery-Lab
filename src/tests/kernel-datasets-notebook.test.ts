import { describe, expect, it } from "vitest";
import {
  KERNEL_LIMITS,
  createNotebookBlock,
  exportDatasetCsv,
  exportDatasetJson,
  parseDatasetCsv,
  parseDatasetJson,
  sanitiseNotebookText,
  summariseDataset,
  validateNotebook
} from "../lib/kernel";

describe("engineering kernel datasets", () => {
  it("imports bounded CSV with typed unit-bearing columns and round-trips quoted text", () => {
    const dataset = parseDatasetCsv(
      'sample,torque,accepted\n"run, one",12.5,true\nrun two,15,false',
      {
        id: "bench-data",
        name: "Bench data",
        unitIds: { torque: "N.m" },
        provenance: {
          sourceLabel: "Learner bench capture",
          licenceId: "MIT",
          learnerGenerated: true
        }
      }
    );
    expect(dataset.columns).toEqual([
      { id: "sample", label: "sample", type: "text" },
      { id: "torque", label: "torque", type: "number", unitId: "N.m" },
      { id: "accepted", label: "accepted", type: "boolean" }
    ]);
    expect(dataset.rows[0]).toEqual({ sample: "run, one", torque: 12.5, accepted: true });

    const restored = parseDatasetCsv(exportDatasetCsv(dataset), {
      id: "bench-data",
      name: "Bench data",
      unitIds: { torque: "N.m" },
      provenance: {
        sourceLabel: "Learner bench capture",
        licenceId: "MIT",
        learnerGenerated: true
      }
    });
    expect(restored).toEqual(dataset);
    expect(parseDatasetJson(exportDatasetJson(dataset))).toEqual(dataset);
    expect(dataset.provenance).toEqual({
      sourceLabel: "Learner bench capture",
      licenceId: "MIT",
      learnerGenerated: true
    });
    expect(summariseDataset(dataset)).toEqual({
      rows: 2,
      columns: 3,
      missingCells: 0,
      duplicateRows: 0
    });
  });

  it("imports a JSON record array deterministically and rejects mixed cell types", () => {
    const dataset = parseDatasetJson(
      '[{"speed":60,"label":"a"},{"label":"b","speed":120}]',
      { id: "speed-data", name: "Speed data", unitIds: { speed: "rpm" } }
    );
    expect(dataset.columns.map((column) => column.id)).toEqual(["label", "speed"]);
    expect(dataset.rows[1]).toEqual({ label: "b", speed: 120 });
    expect(() => parseDatasetJson(
      '[{"value":1},{"value":"not-a-number"}]',
      { id: "mixed", name: "Mixed" }
    )).toThrow(/mixes incompatible/);
  });

  it("retains and reports missing cells and duplicate rows explicitly", () => {
    const dataset = parseDatasetCsv(
      "case,value\nsame,1\nsame,1\nmissing,",
      { id: "duplicate-data", name: "Duplicate data" }
    );
    expect(summariseDataset(dataset)).toEqual({
      rows: 3,
      columns: 2,
      missingCells: 1,
      duplicateRows: 1
    });
  });

  it("rejects oversized, malformed and prototype-polluting imports", () => {
    expect(() => parseDatasetCsv(
      "x".repeat(KERNEL_LIMITS.datasetCharacters + 1),
      { id: "large", name: "Large" }
    )).toThrow(/exceeds/);
    expect(() => parseDatasetCsv(
      'name,value\n"unclosed,1',
      { id: "bad", name: "Bad" }
    )).toThrow(/unclosed/);
    expect(() => parseDatasetCsv(
      'name\n"a"b',
      { id: "bad-closing-quote", name: "Bad closing quote" }
    )).toThrow(/after a closing quote/);
    expect(() => parseDatasetCsv(
      'name\nunquoted"value',
      { id: "bad-unquoted-quote", name: "Bad unquoted quote" }
    )).toThrow(/unexpected quote/);
    expect(() => parseDatasetCsv(
      "case,torque,torque\ncontinuous,10,20",
      { id: "duplicate-headers", name: "Duplicate headers" }
    )).toThrow('duplicate id "torque" was found in CSV headers.');
    expect(() => parseDatasetJson(
      '[{"__proto__":{"polluted":true}}]',
      { id: "unsafe", name: "Unsafe" }
    )).toThrow(/unsafe key/);
    expect(() => parseDatasetJson(JSON.stringify({
      version: 1,
      id: "unsafe-provenance",
      name: "Unsafe provenance",
      source: "manual",
      provenance: {
        sourceLabel: "Local",
        learnerGenerated: "yes"
      },
      columns: [{ id: "value", label: "Value", type: "number" }],
      rows: [{ value: 1 }]
    }))).toThrow(/learnerGenerated must be a boolean/);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});

describe("engineering kernel controlled notebook", () => {
  it("retains only plain sanitised text and typed references", () => {
    const block = createNotebookBlock(
      "calc-note",
      "calculation",
      '<script>alert("x")</script><strong>Result</strong>',
      "calc-1"
    );
    expect(block.text).toBe("Result");
    expect(block).toMatchObject({ kind: "calculation", referenceId: "calc-1" });
    expect(sanitiseNotebookText("<p>safe text</p>")).toBe("safe text");
  });

  it("preserves block order and rejects uncontrolled reference shapes", () => {
    const notebook = validateNotebook({
      version: 1,
      blocks: [
        { version: 1, id: "first", kind: "note", text: "First" },
        { version: 1, id: "second", kind: "dataset", text: "Second", referenceId: "data" }
      ]
    });
    expect(notebook.blocks.map((block) => block.id)).toEqual(["first", "second"]);
    expect(() => validateNotebook({
      version: 1,
      blocks: [{ version: 1, id: "bad", kind: "dataset", text: "Missing ref" }]
    })).toThrow(/referenceId is required/);
    expect(() => createNotebookBlock("bad", "note", "Text", "unexpected")).toThrow(/not valid/);
  });

  it("supports controlled assumptions, reflections, variables, scenarios and table references", () => {
    const blocks = [
      createNotebookBlock("assumption", "assumption", "Constant efficiency is assumed."),
      createNotebookBlock("reflection", "reflection", "The boundary remains explicit."),
      createNotebookBlock("variable", "variable", "Input variable", "input-variable"),
      createNotebookBlock("scenario", "scenario", "Named comparison", "alternate"),
      createNotebookBlock("table", "table", "Accessible result table", "result-table")
    ];
    expect(blocks.map((block) => block.kind)).toEqual([
      "assumption",
      "reflection",
      "variable",
      "scenario",
      "table"
    ]);
    expect(() => createNotebookBlock("missing", "variable", "Missing reference"))
      .toThrow(/referenceId is required/);
  });
});
