import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8").replaceAll("\r\n", "\n");

describe("Engineering Design Studio licence distribution", () => {
  it("pins the reviewed exact-CAD package pair", () => {
    const packageJson = JSON.parse(read("../../package.json")) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies.replicad).toBe("0.23.1");
    expect(packageJson.dependencies["replicad-opencascadejs"]).toBe("0.23.0");
  });

  it("keeps the resolved MIT package licences verbatim", () => {
    expect(read("../../docs/licenses/replicad-0.23.1-MIT.txt").trim()).toBe(
      read("../../node_modules/replicad/LICENSE").trim()
    );
    const wrapperNotice = read("../../docs/licenses/replicad-opencascadejs-0.23.0-MIT.txt").trim();
    expect(wrapperNotice).toContain("Package attribution: replicad-opencascadejs@0.23.0");
    expect(wrapperNotice.endsWith(read("../../node_modules/replicad-opencascadejs/LICENSE").trim())).toBe(true);
  });

  it("retains the OCCT licence and exception texts", () => {
    const lgpl = read("../../docs/licenses/OCCT-7.6-LGPL-2.1.txt");
    const exception = read("../../docs/licenses/OCCT-7.6-Open-CASCADE-Exception-1.0.txt");

    expect(lgpl).toContain("GNU LESSER GENERAL PUBLIC LICENSE");
    expect(lgpl).toContain("version 2.1");
    expect(exception).toContain("Open CASCADE exception (version 1.0)");
    expect(exception).toContain("GNU Lesser General Public License version 2.1");
  });

  it("exposes every notice and source record from the About page", () => {
    const about = read("../pages/About.tsx");

    for (const filename of [
      "replicad-0.23.1-MIT.txt",
      "replicad-opencascadejs-0.23.0-MIT.txt",
      "OCCT-7.6-LGPL-2.1.txt",
      "OCCT-7.6-Open-CASCADE-Exception-1.0.txt",
      "Third-Party-Licences.md",
      "Source-Register.md"
    ]) {
      expect(about).toContain(filename);
      expect(about).toContain(`download="${filename}"`);
    }
    expect(about.match(/\?url&no-inline/g)).toHaveLength(6);
    expect(about).toContain("Exact CAD third-party notice");
    expect(about).toContain("replacement and relinking route");
  });

  it("keeps production source on the single non-exception OCCT payload", () => {
    const worker = read("../lib/cad/brep.worker.ts");

    expect(worker).toContain("replicad_single.wasm?url");
    expect(worker).not.toContain("replicad_with_exceptions.wasm?url");
  });
});
