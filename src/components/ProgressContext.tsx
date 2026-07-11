import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  const api: ProgressApi = {
    progress,
    update: (fn) => setProgress((p) => fn(structuredClone(p))),
    replace: (p) => setProgress(p),
    persistenceAvailable
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
