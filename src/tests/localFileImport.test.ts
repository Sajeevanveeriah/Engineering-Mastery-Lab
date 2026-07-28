import { describe, expect, it, vi } from "vitest";
import { readBoundedLocalTextFile } from "../lib/localFileImport";

describe("bounded local text files", () => {
  it("rejects an oversized file before reading its content", async () => {
    const text = vi.fn(async () => "not read");
    await expect(readBoundedLocalTextFile(
      { size: 1_001, text },
      1_000,
      "Project bundle"
    )).rejects.toThrow(/exceeds 1000 bytes/);
    expect(text).not.toHaveBeenCalled();
  });

  it("reads a file at the exact byte boundary", async () => {
    const text = vi.fn(async () => "{\"version\":3}");
    await expect(readBoundedLocalTextFile(
      { size: 1_000, text },
      1_000,
      "Progress file"
    )).resolves.toBe("{\"version\":3}");
    expect(text).toHaveBeenCalledOnce();
  });

  it("rejects invalid limits and file sizes", async () => {
    await expect(readBoundedLocalTextFile(
      { size: -1, text: async () => "" },
      1_000,
      "Project Pack"
    )).rejects.toThrow(/invalid byte size/);
    await expect(readBoundedLocalTextFile(
      { size: 0, text: async () => "" },
      0,
      "Project Pack"
    )).rejects.toThrow(/byte limit is invalid/);
  });
});
