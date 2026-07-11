import { useCallback, useEffect, useState } from "react";
import type { PlatformBridge } from "../lib/platform/bridge";
import { isSafeRelPath } from "../lib/platform/paths";
import { validateNetlist } from "../lib/adapters/ngspice/netlist";
import { Icon } from "./Icon";

interface Props {
  bridge: PlatformBridge;
  workspaceRoot: string;
  onSaved?: (relPath: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

type EditableFolder = "circuits" | "requirements";
const MAX_EDITABLE_FILE_BYTES = 1024 * 1024;

function isEditableName(folder: EditableFolder, name: string): boolean {
  return folder === "circuits"
    ? /\.(cir|spice|net|txt)$/i.test(name)
    : /\.(md|txt)$/i.test(name);
}

interface FileSnapshot {
  folder: EditableFolder;
  fileName: string;
  contents: string;
  openPath: string | null;
}

const initialContents = "* New circuit\nV1 in 0 DC 5\nR1 in out 1k\nR2 out 0 2k\n.end\n";

export function WorkspaceFileEditor({ bridge, workspaceRoot, onSaved, onDirtyChange }: Props) {
  const [folder, setFolder] = useState<EditableFolder>("circuits");
  const [files, setFiles] = useState<Record<EditableFolder, string[]>>({ circuits: [], requirements: [] });
  const [fileName, setFileName] = useState("design.cir");
  const [contents, setContents] = useState(initialContents);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<FileSnapshot>({ folder: "circuits", fileName: "design.cir", contents: initialContents, openPath: null });
  const [status, setStatus] = useState<{ type: "success" | "error" | "neutral"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = folder !== savedSnapshot.folder || fileName !== savedSnapshot.fileName ||
    contents !== savedSnapshot.contents || openPath !== savedSnapshot.openPath;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const refresh = useCallback(async () => {
    const [circuits, requirements] = await Promise.all([
      bridge.listDir(workspaceRoot, "circuits"),
      bridge.listDir(workspaceRoot, "requirements")
    ]);
    setFiles({
      circuits: circuits.filter((name) => isEditableName("circuits", name)).sort(),
      requirements: requirements.filter((name) => isEditableName("requirements", name)).sort()
    });
  }, [bridge, workspaceRoot]);

  useEffect(() => {
    void refresh().catch((error) => setStatus({ type: "error", text: `Could not list workspace files: ${error instanceof Error ? error.message : String(error)}` }));
  }, [refresh]);

  const newFile = (nextFolder: EditableFolder = folder) => {
    if (dirty && !window.confirm("Discard the unsaved file draft and start another file?")) return;
    const nextContents = nextFolder === "circuits" ? initialContents : "# Project requirements\n\n- REQ-001: Define the acceptance criterion.\n";
    const nextName = nextFolder === "circuits" ? "design.cir" : "spec.md";
    setFolder(nextFolder);
    setFileName(nextName);
    setContents(nextContents);
    setOpenPath(null);
    setSavedSnapshot({ folder: nextFolder, fileName: nextName, contents: nextContents, openPath: null });
    setStatus(null);
  };

  const openFile = async (nextFolder: EditableFolder, name: string) => {
    if (dirty && !window.confirm("Discard the unsaved file draft and open another file?")) return;
    const relPath = `${nextFolder}/${name}`;
    setBusy(true);
    setStatus(null);
    try {
      const nextContents = await bridge.readTextFile(workspaceRoot, relPath, MAX_EDITABLE_FILE_BYTES);
      setContents(nextContents);
      setFolder(nextFolder);
      setFileName(name);
      setOpenPath(relPath);
      setSavedSnapshot({ folder: nextFolder, fileName: name, contents: nextContents, openPath: relPath });
    } catch (error) {
      setStatus({ type: "error", text: `Could not open ${relPath}: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setBusy(false);
    }
  };

  const saveFile = async () => {
    const name = fileName.trim();
    const relPath = `${folder}/${name}`;
    const byteSize = new Blob([contents]).size;
    if (!name || name.includes("/") || name.includes("\\") || !isSafeRelPath(relPath)) {
      setStatus({ type: "error", text: "File name must be a safe name without folders or traversal characters." });
      return;
    }
    const allowed = folder === "circuits" ? /\.(cir|spice|net|txt)$/i : /\.(md|txt)$/i;
    if (!allowed.test(name)) {
      setStatus({ type: "error", text: folder === "circuits" ? "Circuit files must use .cir, .spice, .net or .txt." : "Requirement files must use .md or .txt." });
      return;
    }
    if (byteSize > MAX_EDITABLE_FILE_BYTES) {
      setStatus({ type: "error", text: `File is ${byteSize.toLocaleString("en-AU")} bytes; the in-app editor limit is ${MAX_EDITABLE_FILE_BYTES.toLocaleString("en-AU")} bytes.` });
      return;
    }
    if (folder === "circuits") {
      const errors = validateNetlist(contents).filter((issue) => issue.severity === "error");
      if (errors.length > 0) {
        setStatus({ type: "error", text: `Netlist was not saved: ${errors.map((issue) => issue.message).join(" ")}` });
        return;
      }
    }
    setBusy(true);
    setStatus(null);
    try {
      const exists = await bridge.fileExists(workspaceRoot, relPath);
      if (exists && openPath !== relPath && !window.confirm(`Replace the existing workspace file ${relPath}?`)) return;
      await bridge.writeTextFileAtomic(workspaceRoot, relPath, contents);
      setOpenPath(relPath);
      setSavedSnapshot({ folder, fileName: name, contents, openPath: relPath });
      setStatus({ type: "success", text: `${relPath} saved.` });
      await refresh();
      onSaved?.(relPath);
    } catch (error) {
      setStatus({ type: "error", text: `Could not save ${relPath}: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card workspace-files" aria-labelledby="workspace-files-heading">
      <div className="section-heading"><div><p className="eyebrow">Workspace inputs</p><h2 id="workspace-files-heading">Text files</h2></div><div className="button-row"><button type="button" onClick={() => newFile("circuits")}><Icon name="plus" size={16} /> New netlist</button><button type="button" onClick={() => newFile("requirements")}><Icon name="plus" size={16} /> New requirement note</button></div></div>
      <p className="muted">Create or edit text-based SPICE inputs and requirement notes without leaving the app. KiCad design files remain authored in KiCad and copied into the project’s <code>circuits/</code> or <code>pcb/</code> folder.</p>
      <div className="workspace-files__layout">
        <aside className="file-list" aria-label="Editable workspace files">
          {(["circuits", "requirements"] as EditableFolder[]).map((group) => <div key={group}><h3>{group === "circuits" ? "Circuits" : "Requirements"}</h3>{files[group].length === 0 ? <p>No files</p> : <ul>{files[group].map((name) => <li key={name}><button type="button" className={openPath === `${group}/${name}` ? "active" : ""} onClick={() => void openFile(group, name)}><Icon name="file" size={15} /><span>{name}</span></button></li>)}</ul>}</div>)}
        </aside>
        <div className="file-editor">
          <div className="form-grid form-grid--2"><div className="form-field"><label htmlFor="file-folder">Folder</label><select id="file-folder" value={folder} onChange={(event) => newFile(event.target.value as EditableFolder)}><option value="circuits">circuits</option><option value="requirements">requirements</option></select></div><div className="form-field"><label htmlFor="file-name">File name</label><input id="file-name" value={fileName} onChange={(event) => { setFileName(event.target.value); if (openPath !== `${folder}/${event.target.value}`) setOpenPath(null); }} /></div></div>
          <div className="form-field"><label htmlFor="file-contents">Contents</label><textarea id="file-contents" className="code-input" rows={16} value={contents} spellCheck={false} onChange={(event) => setContents(event.target.value)} /></div>
          <div className="file-editor__footer"><span className="small muted">{new Blob([contents]).size.toLocaleString("en-AU")} bytes · {openPath ?? "new file"}</span><button className="primary" type="button" disabled={busy} onClick={() => void saveFile()}><Icon name="save" size={16} /> {busy ? "Working" : "Save file"}</button></div>
          {status && <p className={`inline-message inline-message--${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.text}</p>}
        </div>
      </div>
    </section>
  );
}
