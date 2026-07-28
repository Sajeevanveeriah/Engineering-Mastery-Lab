import type { Theme, ThemePreference } from "./storage";

export const LIGHT_THEME_COLOUR = "#f3f6fa";
export const DARK_THEME_COLOUR = "#050c16";

export function resolveTheme(preference: ThemePreference, systemDark: boolean): Theme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

export function applyTheme(
  preference: ThemePreference,
  systemDark: boolean,
  root: HTMLElement = document.documentElement,
  themeColourMeta: HTMLMetaElement | null =
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
): Theme {
  const resolved = resolveTheme(preference, systemDark);
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  themeColourMeta?.setAttribute("content", resolved === "dark" ? DARK_THEME_COLOUR : LIGHT_THEME_COLOUR);
  return resolved;
}

