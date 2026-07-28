import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadProgress, saveProgress, type ProgressState, type Theme } from "../lib/storage";
import { applyTheme, resolveTheme } from "../lib/theme";

interface ProgressApi {
  progress: ProgressState;
  update: (fn: (p: ProgressState) => ProgressState) => void;
  replace: (p: ProgressState) => void;
  persistenceAvailable: boolean;
  resolvedTheme: Theme;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    setPersistenceAvailable(saveProgress(progress));
  }, [progress]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    if (progress.themePreference !== "system") return;
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [progress.themePreference]);

  useEffect(() => {
    applyTheme(progress.themePreference, systemDark);
  }, [progress.themePreference, systemDark]);

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((current) => fn(structuredClone(current)));
  }, []);
  const replace = useCallback((next: ProgressState) => setProgress(next), []);
  const resolvedTheme = resolveTheme(progress.themePreference, systemDark);
  const api = useMemo<ProgressApi>(() => ({
    progress,
    update,
    replace,
    persistenceAvailable,
    resolvedTheme
  }), [persistenceAvailable, progress, replace, resolvedTheme, update]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
