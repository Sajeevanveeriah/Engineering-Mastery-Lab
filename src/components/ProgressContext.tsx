import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadProgress, saveProgress, type ProgressState } from "../lib/storage";

interface ProgressApi {
  progress: ProgressState;
  update: (fn: (p: ProgressState) => ProgressState) => void;
  replace: (p: ProgressState) => void;
  persistenceAvailable: boolean;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);

  useEffect(() => {
    setPersistenceAvailable(saveProgress(progress));
    document.documentElement.dataset.theme = progress.theme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
      "content",
      progress.theme === "dark" ? "#050c16" : "#f3f6fa"
    );
  }, [progress]);

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((current) => fn(structuredClone(current)));
  }, []);
  const replace = useCallback((next: ProgressState) => setProgress(next), []);
  const api = useMemo<ProgressApi>(() => ({
    progress,
    update,
    replace,
    persistenceAvailable
  }), [persistenceAvailable, progress, replace, update]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
