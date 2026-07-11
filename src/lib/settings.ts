// Desktop tool settings (executable path overrides), stored as UI state.

export interface ToolSettings {
  ngspicePath?: string;
  kicadCliPath?: string;
}

const KEY = "engineering-workbench/tool-settings/v1";

export function loadToolSettings(storage: Pick<Storage, "getItem"> = localStorage): ToolSettings {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const p = parsed as Record<string, unknown>;
    return {
      ngspicePath: typeof p.ngspicePath === "string" && p.ngspicePath.length > 0 ? p.ngspicePath : undefined,
      kicadCliPath: typeof p.kicadCliPath === "string" && p.kicadCliPath.length > 0 ? p.kicadCliPath : undefined
    };
  } catch {
    return {};
  }
}

export function saveToolSettings(settings: ToolSettings, storage: Pick<Storage, "setItem"> = localStorage): void {
  try {
    storage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable; overrides just won't persist.
  }
}
