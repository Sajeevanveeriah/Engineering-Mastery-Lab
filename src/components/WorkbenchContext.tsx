import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction } from "react";
import type { AdapterResult } from "../lib/adapters/contract";
import type { PlatformBridge } from "../lib/platform/bridge";
import type { LatestRunReceipt } from "../lib/report/receipt";
import { getPlatformBridge } from "../lib/platform/tauriBridge";
import type { OpenWorkspace, RecentProject } from "../lib/workspace/workspace";
import { loadRecentProjects } from "../lib/workspace/workspace";

interface WorkbenchSessionApi {
  bridge: PlatformBridge | null | undefined;
  bridgeError: string | null;
  workspace: OpenWorkspace | null;
  setWorkspace: Dispatch<SetStateAction<OpenWorkspace | null>>;
  recents: RecentProject[];
  setRecents: Dispatch<SetStateAction<RecentProject[]>>;
  results: Record<string, AdapterResult>;
  setResults: Dispatch<SetStateAction<Record<string, AdapterResult>>>;
  receipts: Record<string, LatestRunReceipt>;
  setReceipts: Dispatch<SetStateAction<Record<string, LatestRunReceipt>>>;
  sessionReceipts: Record<string, LatestRunReceipt>;
  setSessionReceipts: Dispatch<SetStateAction<Record<string, LatestRunReceipt>>>;
  running: string | null;
  setRunning: Dispatch<SetStateAction<string | null>>;
  dirty: boolean;
  manifestDirty: boolean;
  setDirty: Dispatch<SetStateAction<boolean>>;
  setDraftDirty: (source: string, dirty: boolean) => void;
  clearDraftDirty: () => void;
  unsavedSummary: string;
  abortRef: MutableRefObject<AbortController | null>;
}

const WorkbenchSession = createContext<WorkbenchSessionApi | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [bridge, setBridge] = useState<PlatformBridge | null | undefined>(undefined);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<OpenWorkspace | null>(null);
  const [recents, setRecents] = useState<RecentProject[]>(() => loadRecentProjects());
  const [results, setResults] = useState<Record<string, AdapterResult>>({});
  const [receipts, setReceipts] = useState<Record<string, LatestRunReceipt>>({});
  const [sessionReceipts, setSessionReceipts] = useState<Record<string, LatestRunReceipt>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [manifestDirty, setDirty] = useState(false);
  const [draftDirty, setDraftDirtyState] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);
  const setDraftDirty = useCallback((source: string, dirty: boolean) => {
    setDraftDirtyState((current) => {
      if (dirty) return current[source] ? current : { ...current, [source]: true };
      if (!current[source]) return current;
      const next = { ...current };
      delete next[source];
      return next;
    });
  }, []);
  const clearDraftDirty = useCallback(() => setDraftDirtyState({}), []);
  const dirtySources = Object.keys(draftDirty).filter((source) => draftDirty[source]);
  const dirty = manifestDirty || dirtySources.length > 0;
  const unsavedSummary = useMemo(() => {
    const labels = [
      ...(manifestDirty ? ["project definition"] : []),
      ...dirtySources.map((source) => source.replaceAll("-", " "))
    ];
    return labels.length > 0 ? labels.join(", ") : "none";
  }, [dirtySources.join("|"), manifestDirty]);

  useEffect(() => {
    let active = true;
    getPlatformBridge().then(
      (resolved) => { if (active) setBridge(resolved); },
      (error) => {
        if (!active) return;
        setBridge(null);
        setBridgeError(`Failed to initialise the desktop bridge: ${error instanceof Error ? error.message : String(error)}`);
      }
    );
    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <WorkbenchSession.Provider value={{
      bridge,
      bridgeError,
      workspace,
      setWorkspace,
      recents,
      setRecents,
      results,
      setResults,
      receipts,
      setReceipts,
      sessionReceipts,
      setSessionReceipts,
      running,
      setRunning,
      dirty,
      manifestDirty,
      setDirty,
      setDraftDirty,
      clearDraftDirty,
      unsavedSummary,
      abortRef
    }}>
      {children}
    </WorkbenchSession.Provider>
  );
}

export function useWorkbenchSession(): WorkbenchSessionApi {
  const context = useContext(WorkbenchSession);
  if (!context) throw new Error("useWorkbenchSession must be used inside WorkbenchProvider");
  return context;
}
