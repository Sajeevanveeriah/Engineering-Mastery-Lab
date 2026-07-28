import { describe, expect, it, vi } from "vitest";
import { applyTheme, resolveTheme } from "../lib/theme";

describe("theme selection and resolution", () => {
  it("resolves an unset new preference through System", () => {
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
  });

  it("updates when the operating-system appearance changes in System mode", () => {
    const before = resolveTheme("system", false);
    const after = resolveTheme("system", true);
    expect(before).toBe("light");
    expect(after).toBe("dark");
  });

  it("keeps manual overrides when the operating-system appearance changes", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("stores selected and resolved appearances separately", () => {
    const root = { dataset: {}, style: {} } as unknown as HTMLElement;
    const meta = { setAttribute: vi.fn() } as unknown as HTMLMetaElement;
    expect(applyTheme("system", true, root, meta)).toBe("dark");
    expect(root.dataset.themePreference).toBe("system");
    expect(root.dataset.theme).toBe("dark");
    expect(root.style.colorScheme).toBe("dark");
    expect(meta.setAttribute).toHaveBeenCalledWith("content", "#050c16");
  });
});

