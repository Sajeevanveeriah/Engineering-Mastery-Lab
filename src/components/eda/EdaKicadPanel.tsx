import { useState, type ChangeEvent } from "react";
import {
  EDA_EXTERNAL_VERIFICATION_STATE,
  acknowledgeKicadLosses,
  exportKicadProject,
  importKicadProject,
  importKicadSExpression,
  inspectKicadProjectLosses,
  type EdaDocument,
  type KicadImport,
  type LossEntry
} from "../../lib/eda";

interface EdaKicadPanelProps {
  document: EdaDocument;
  onReplace: (document: EdaDocument, status: string) => void;
}

// Mirrors the domain parser ceiling. This guard must run before File.text() allocates the file contents.
const KICAD_FILE_BYTE_LIMIT = 10_000_000;

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function EdaKicadPanel({ document, onReplace }: EdaKicadPanelProps) {
  const [schematicFile, setSchematicFile] = useState<File>();
  const [pcbFile, setPcbFile] = useState<File>();
  const [preview, setPreview] = useState<KicadImport>();
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [carriedLosses, setCarriedLosses] = useState<LossEntry[]>([]);
  const [preparedLosses, setPreparedLosses] = useState<LossEntry[]>();
  const [exportConfirmed, setExportConfirmed] = useState(false);
  const [error, setError] = useState("");

  const chooseSchematic = (event: ChangeEvent<HTMLInputElement>) => {
    setSchematicFile(event.target.files?.[0]);
    setPreview(undefined);
    setReplaceConfirmed(false);
    setError("");
  };
  const choosePcb = (event: ChangeEvent<HTMLInputElement>) => {
    setPcbFile(event.target.files?.[0]);
    setPreview(undefined);
    setReplaceConfirmed(false);
    setError("");
  };
  const previewImport = async () => {
    setError("");
    try {
      if (!schematicFile) throw new Error("Choose a .kicad_sch file before previewing the import.");
      if (schematicFile.size > KICAD_FILE_BYTE_LIMIT) throw new Error(`KiCad schematic exceeds the ${KICAD_FILE_BYTE_LIMIT} byte import limit.`);
      if (pcbFile && pcbFile.size > KICAD_FILE_BYTE_LIMIT) throw new Error(`KiCad PCB exceeds the ${KICAD_FILE_BYTE_LIMIT} byte import limit.`);
      const schematicText = await schematicFile.text();
      const imported = pcbFile
        ? importKicadProject({ schematicText, pcbText: await pcbFile.text() })
        : importKicadSExpression(schematicText);
      setPreview(imported);
      setReplaceConfirmed(false);
    } catch (caught) {
      setPreview(undefined);
      setError(caught instanceof Error ? caught.message : "KiCad import preview failed.");
    }
  };
  const replace = () => {
    if (!preview || !replaceConfirmed) return;
    setCarriedLosses(preview.lossReport);
    setPreparedLosses(undefined);
    setExportConfirmed(false);
    onReplace(preview.document, `Imported bounded KiCad subset from ${schematicFile?.name ?? "schematic"}${pcbFile ? ` and ${pcbFile.name}` : ""}; ${preview.lossReport.length} reported loss${preview.lossReport.length === 1 ? "" : "es"} acknowledged.`);
  };
  const prepareExport = () => {
    setError("");
    try {
      setPreparedLosses(inspectKicadProjectLosses(document, carriedLosses));
      setExportConfirmed(false);
    } catch (caught) {
      setPreparedLosses(undefined);
      setError(caught instanceof Error ? caught.message : "KiCad export preparation failed.");
    }
  };
  const downloadExport = (kind: "schematic" | "pcb") => {
    if (!preparedLosses) return;
    if (preparedLosses.length > 0 && !exportConfirmed) return;
    try {
      const exactLosses = inspectKicadProjectLosses(document, carriedLosses);
      if (JSON.stringify(exactLosses) !== JSON.stringify(preparedLosses)) throw new Error("The document or loss report changed. Prepare the KiCad export again before acknowledging it.");
      const exported = exportKicadProject(document, { preservedUnsupported: carriedLosses, lossAcknowledgement: exactLosses.length ? acknowledgeKicadLosses(exactLosses) : undefined });
      const base = document.id.replace(/[^A-Za-z0-9._-]+/g, "-");
      downloadText(`${base}.${kind === "schematic" ? "kicad_sch" : "kicad_pcb"}`, kind === "schematic" ? exported.schematicText : exported.pcbText);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "KiCad export failed.");
    }
  };
  const exportLosses = preparedLosses ?? [];

  return <section className="eda-kicad" aria-labelledby="eda-kicad-heading">
    <div className="eda-result-heading"><div><h3 id="eda-kicad-heading">KiCad bounded interchange</h3></div><div className="button-row"><span className="badge warn">{EDA_EXTERNAL_VERIFICATION_STATE.fixture}</span><span className="badge info">{EDA_EXTERNAL_VERIFICATION_STATE.realTool}</span></div></div>
    <p className="muted small">Genuine KiCad S-expression files are processed locally. Adapters invoked: {String(EDA_EXTERNAL_VERIFICATION_STATE.adaptersInvoked)}.</p>
    <div className="eda-kicad-grid">
      <section aria-labelledby="kicad-import-heading"><h4 id="kicad-import-heading">Import</h4><div className="eda-property-grid">
        <label>KiCad schematic (.kicad_sch)<input type="file" accept=".kicad_sch" onChange={chooseSchematic} /></label>
        <label>Optional KiCad PCB (.kicad_pcb)<input type="file" accept=".kicad_pcb" onChange={choosePcb} /></label>
        <button type="button" onClick={previewImport}>Preview KiCad import</button>
      </div>
      {preview && <div className="eda-loss-preview"><p><strong>Generator:</strong> {preview.generator}</p><LossTable caption="KiCad import loss report" losses={preview.lossReport} empty="No bounded-subset losses were reported." /><label className="eda-confirm"><input type="checkbox" checked={replaceConfirmed} onChange={(event) => setReplaceConfirmed(event.target.checked)} /> I confirm replacement of the current document and acknowledge every reported KiCad loss.</label><button type="button" className="primary" disabled={!replaceConfirmed} onClick={replace}>Replace current document</button></div>}
      </section>
      <section aria-labelledby="kicad-export-heading"><h4 id="kicad-export-heading">Export</h4><button type="button" onClick={prepareExport}>Prepare KiCad export</button>
      {preparedLosses && <div className="eda-loss-preview"><LossTable caption="KiCad export loss report" losses={exportLosses} empty="No bounded-subset losses were reported." />{exportLosses.length > 0 && <label className="eda-confirm"><input type="checkbox" checked={exportConfirmed} onChange={(event) => setExportConfirmed(event.target.checked)} /> I acknowledge every reported export loss.</label>}<div className="button-row"><button type="button" disabled={exportLosses.length > 0 && !exportConfirmed} onClick={() => downloadExport("schematic")}>Download .kicad_sch</button><button type="button" disabled={exportLosses.length > 0 && !exportConfirmed} onClick={() => downloadExport("pcb")}>Download .kicad_pcb</button></div></div>}
      </section>
    </div>
    {error && <div className="inline-message inline-message--error" role="alert"><strong>KiCad operation held</strong><p>{error}</p></div>}
  </section>;
}

function LossTable({ caption, losses, empty }: { caption: string; losses: LossEntry[]; empty: string }) {
  return <div className="table-scroll"><table><caption>{caption}</caption><thead><tr><th>Code</th><th>Message</th><th>Preserved source</th></tr></thead><tbody>{losses.length ? losses.map((loss, index) => <tr key={`${loss.code}-${index}`}><th scope="row">{loss.code}</th><td>{loss.message}</td><td><code>{loss.preserved || "None"}</code></td></tr>) : <tr><td colSpan={3}>{empty}</td></tr>}</tbody></table></div>;
}
