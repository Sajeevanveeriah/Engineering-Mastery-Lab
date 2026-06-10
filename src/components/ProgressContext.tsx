import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadProgress, saveProgress, type ProgressState } from "../lib/storage";

interface ProgressApi {
  progress: ProgressState;
  update: (fn: (p: ProgressState) => ProgressState) => void;
  replace: (p: ProgressState) => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
    document.documentElement.dataset.theme = progress.theme;
  }, [progress]);

  const api: ProgressApi = {
    progress,
    update: (fn) => setProgress((p) => fn(structuredClone(p))),
    replace: (p) => setProgress(p)
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
