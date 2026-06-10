import { useEffect, useState } from "react";
import { ModuleShell } from "../components/ModuleShell";
import { Tabs } from "../components/Tabs";
import { moduleById } from "../data/modules";

interface ColumnDef {
  key: string;
  label: string;
  kind?: "text" | "select";
  options?: string[];
  width?: string;
}

type Row = Record<string, string>;

function useStoredRows(storageKey: string, seed: Row[]): [Row[], (r: Row[]) => void] {
  const [rows, setRows] = useState<Row[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as Row[];
    } catch {
      /* fall through to seed */
    }
    return seed;
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(rows));
    } catch {
      /* storage unavailable; keep working in memory */
    }
  }, [rows, storageKey]);
  return [rows, setRows];
}

function TableBuilder({
  title,
  description,
  storageKey,
  columns,
  seed,
  extra
}: {
  title: string;
  description: string;
  storageKey: string;
  columns: ColumnDef[];
  seed: Row[];
  extra?: (rows: Row[]) => React.ReactNode;
}) {
  const [rows, setRows] = useStoredRows(storageKey, seed);

  const setCell = (i: number, key: string, value: string) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const addRow = () => setRows([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ artefact: title, exportedAt: new Date().toISOString(), rows }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storageKey.split("/").pop()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="small muted">{description}</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
              ))}
              <th style={{ width: "3rem" }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.kind === "select" ? (
                      <select aria-label={`${c.label} row ${i + 1}`} value={r[c.key] ?? ""} onChange={(e) => setCell(i, c.key, e.target.value)}>
                        <option value="">—</option>
                        {c.options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input aria-label={`${c.label} row ${i + 1}`} style={{ width: "100%", minWidth: "6rem" }} value={r[c.key] ?? ""} onChange={(e) => setCell(i, c.key, e.target.value)} />
                    )}
                  </td>
                ))}
                <td>
                  <button aria-label={`Delete row ${i + 1}`} onClick={() => removeRow(i)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <button onClick={addRow}>Add row</button>{" "}
        <button className="primary" onClick={exportJson}>Export JSON</button>
      </p>
      {extra?.(rows)}
    </div>
  );
}

const scores = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function FmeaExtra(rows: Row[]) {
  const ranked = rows
    .map((r) => ({ item: r.item || "(unnamed)", rpn: Number(r.severity || 0) * Number(r.occurrence || 0) * Number(r.detection || 0) }))
    .filter((r) => r.rpn > 0)
    .sort((a, b) => b.rpn - a.rpn);
  if (ranked.length === 0) return <p className="small muted">Score S, O and D (1–10) to compute RPN rankings.</p>;
  return (
    <p className="small">
      <strong>RPN ranking:</strong> {ranked.map((r) => `${r.item} (${r.rpn})`).join(" · ")} — act on the highest first.
    </p>
  );
}

const fatSeed: Row[] = [
  { step: "Power up the system; verify no alarms at idle", expected: "No active alarms", result: "", notes: "" },
  { step: "Press Start with guard closed", expected: "Motor runs", result: "", notes: "" },
  { step: "Press Stop while running", expected: "Motor stops cleanly", result: "", notes: "" },
  { step: "Open guard, attempt Start", expected: "Start inhibited, alarm shown", result: "", notes: "" },
  { step: "Trigger jam sensor while running", expected: "Motor stops, fault latches", result: "", notes: "" },
  { step: "Attempt restart with jam present", expected: "Restart refused", result: "", notes: "" },
  { step: "Clear jam, press Reset, press Start", expected: "Motor restarts normally", result: "", notes: "" },
  { step: "Press E-stop while running", expected: "Immediate stop, latched fault", result: "", notes: "" }
];

function Simulator() {
  return (
    <Tabs
      tabs={[
        {
          id: "trace",
          label: "Traceability",
          content: (
            <TableBuilder
              title="Requirements → test traceability matrix"
              description="Every requirement gets an ID, a testable statement, the test that verifies it and the latest result."
              storageKey="engineering-mastery-lab/artefacts/traceability"
              columns={[
                { key: "reqId", label: "Req ID", width: "6rem" },
                { key: "requirement", label: "Requirement (testable statement)" },
                { key: "test", label: "Verifying test" },
                { key: "result", label: "Result", kind: "select", options: ["Pass", "Fail", "Not run"], width: "7rem" }
              ]}
              seed={[{ reqId: "REQ-001", requirement: "Conveyor shall not start while the guard is open.", test: "PLC Lab challenge 2 step: open guard, press Start", result: "Not run" }]}
            />
          )
        },
        {
          id: "fmea",
          label: "FMEA",
          content: (
            <TableBuilder
              title="FMEA builder"
              description="Failure Modes and Effects Analysis. RPN = Severity × Occurrence × Detection (each 1–10; for Detection, 10 = hardest to detect)."
              storageKey="engineering-mastery-lab/artefacts/fmea"
              columns={[
                { key: "item", label: "Item / function" },
                { key: "mode", label: "Failure mode" },
                { key: "effect", label: "Effect" },
                { key: "severity", label: "S", kind: "select", options: scores, width: "4rem" },
                { key: "occurrence", label: "O", kind: "select", options: scores, width: "4rem" },
                { key: "detection", label: "D", kind: "select", options: scores, width: "4rem" },
                { key: "mitigation", label: "Mitigation action" }
              ]}
              seed={[{ item: "Fill valve", mode: "Stuck open", effect: "Tank overfill", severity: "8", occurrence: "3", detection: "4", mitigation: "High-high level trip closes valve (latched)" }]}
              extra={FmeaExtra}
            />
          )
        },
        {
          id: "risk",
          label: "Risk register",
          content: (
            <TableBuilder
              title="Risk register"
              description="Project risks, not just technical failures. Each risk needs an owner and a mitigation."
              storageKey="engineering-mastery-lab/artefacts/risks"
              columns={[
                { key: "risk", label: "Risk description" },
                { key: "likelihood", label: "Likelihood", kind: "select", options: ["Low", "Medium", "High"], width: "8rem" },
                { key: "impact", label: "Impact", kind: "select", options: ["Low", "Medium", "High"], width: "8rem" },
                { key: "owner", label: "Owner", width: "8rem" },
                { key: "mitigation", label: "Mitigation" }
              ]}
              seed={[{ risk: "Long-lead sensor delays commissioning", likelihood: "Medium", impact: "High", owner: "Saj", mitigation: "Order early; identify second-source part" }]}
            />
          )
        },
        {
          id: "fat",
          label: "FAT / SAT",
          content: (
            <TableBuilder
              title="FAT / SAT checklist"
              description="Scripted acceptance test: step, expected result, actual result, notes. Pre-seeded for the PLC Lab conveyor — edit for your own system."
              storageKey="engineering-mastery-lab/artefacts/fat"
              columns={[
                { key: "step", label: "Test step" },
                { key: "expected", label: "Expected result" },
                { key: "result", label: "Result", kind: "select", options: ["Pass", "Fail", "N/A"], width: "6rem" },
                { key: "notes", label: "Notes" }
              ]}
              seed={fatSeed}
            />
          )
        },
        {
          id: "decisions",
          label: "Decision log",
          content: (
            <TableBuilder
              title="Engineering decision log"
              description="What was decided, when, by whom, and — most importantly — why. The rationale is the part future-you will need."
              storageKey="engineering-mastery-lab/artefacts/decisions"
              columns={[
                { key: "date", label: "Date", width: "7rem" },
                { key: "decision", label: "Decision" },
                { key: "rationale", label: "Rationale" },
                { key: "alternatives", label: "Alternatives considered" },
                { key: "owner", label: "Decided by", width: "8rem" }
              ]}
              seed={[]}
            />
          )
        }
      ]}
    />
  );
}

export function PracticeLab() {
  const mod = moduleById("practice")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}
