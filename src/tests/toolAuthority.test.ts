import { describe, expect, it } from "vitest";
import { MemoryBridge } from "../lib/platform/memoryBridge";

describe("host-owned tool selection contract", () => {
  it("uses a native-picker result for the session, then returns to auto-detection", async () => {
    const bridge = new MemoryBridge();
    bridge.detections.set("ngspice", {
      found: true,
      path: "C:/auto/ngspice.exe",
      version: "ngspice-44"
    });
    bridge.pickedDetections.set("ngspice", {
      found: true,
      path: "C:/selected/ngspice.exe",
      version: "ngspice-45"
    });

    const selected = await bridge.pickToolExecutable("ngspice");
    expect(selected?.path).toBe("C:/selected/ngspice.exe");
    expect((await bridge.detectTool("ngspice")).version).toBe("ngspice-45");

    await bridge.clearToolExecutable("ngspice");
    expect((await bridge.detectTool("ngspice")).path).toBe("C:/auto/ngspice.exe");
  });

  it("preserves auto-detection when the native picker is cancelled", async () => {
    const bridge = new MemoryBridge();
    bridge.detections.set("kicad-cli", {
      found: true,
      path: "C:/auto/kicad-cli.exe",
      version: "10.0.0"
    });
    bridge.pickedDetections.set("kicad-cli", null);

    expect(await bridge.pickToolExecutable("kicad-cli")).toBeNull();
    expect((await bridge.detectTool("kicad-cli")).path).toBe("C:/auto/kicad-cli.exe");
  });
});
