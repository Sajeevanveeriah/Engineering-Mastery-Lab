// Path safety helpers shared by the workspace layer and the in-memory bridge.
// The Rust side re-validates every path independently (defence in depth).

/**
 * A safe workspace-relative path: POSIX separators, no absolute paths, no
 * drive letters, no UNC prefixes, no `.`/`..` segments, no empty segments,
 * no NUL bytes.
 */
const RESERVED_NAMES = new Set([
  "con", "prn", "aux", "nul",
  "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
  "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"
]);

export function isSafeRelPath(relPath: string): boolean {
  if (relPath.length === 0 || relPath.length > 4096) return false;
  if (relPath.includes("\0")) return false;
  if (relPath.includes("\\")) return false; // require POSIX form everywhere
  if (relPath.startsWith("/") || relPath.startsWith("~")) return false;
  if (/^[a-zA-Z]:/.test(relPath)) return false; // windows drive letter
  const segments = relPath.split("/");
  return segments.every((s) => {
    if (s.length === 0 || s === "." || s === "..") return false;
    if (s.includes(":")) return false; // NTFS alternate data streams
    const stem = s.split(".")[0].toLowerCase();
    return !RESERVED_NAMES.has(stem); // windows reserved device names
  });
}

export function assertSafeRelPath(relPath: string): void {
  if (!isSafeRelPath(relPath)) {
    throw new Error(
      `Unsafe workspace-relative path rejected: ${JSON.stringify(relPath)}. ` +
        "Paths must be relative, use forward slashes, and contain no '..' segments."
    );
  }
}

/** Join a workspace-relative directory and file name safely. */
export function joinRel(...parts: string[]): string {
  const joined = parts.filter((p) => p.length > 0).join("/");
  assertSafeRelPath(joined);
  return joined;
}
