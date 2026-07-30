(() => {
  const allowed = new Set(["system", "light", "dark"]);
  let preference = "system";
  try {
    for (const version of [5, 4]) {
      const current = JSON.parse(
        localStorage.getItem(`engineering-mastery-lab/progress/v${version}`) || "null"
      );
      if (current && allowed.has(current.themePreference)) {
        preference = current.themePreference;
        break;
      }
    }
    if (preference === "system") {
      for (const version of [3, 2, 1]) {
        const legacy = JSON.parse(
          localStorage.getItem(`engineering-mastery-lab/progress/v${version}`) || "null"
        );
        if (legacy && (legacy.theme === "light" || legacy.theme === "dark")) {
          preference = legacy.theme;
          break;
        }
      }
    }
  } catch {
    preference = "system";
  }
  const systemDark = typeof matchMedia === "function"
    && matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = preference === "system"
    ? (systemDark ? "dark" : "light")
    : preference;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    resolved === "dark" ? "#050c16" : "#f3f6fa"
  );
})();
