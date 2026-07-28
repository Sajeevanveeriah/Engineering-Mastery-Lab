import { describe, expect, it, vi } from "vitest";
import {
  createIdempotentCleanup,
  supportsWebGl2,
  type WebGl2CanvasLike
} from "../lib/webgl";

describe("WebGL2 preflight", () => {
  it("accepts a WebGL2 context and releases the transient context", () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn(() => ({ loseContext }));
    const context = { getExtension } as unknown as WebGL2RenderingContext;
    const canvas: WebGl2CanvasLike = {
      getContext: vi.fn(() => context)
    };

    expect(supportsWebGl2(() => canvas)).toBe(true);
    expect(canvas.getContext).toHaveBeenCalledWith("webgl2", {
      alpha: false,
      antialias: true,
      powerPreference: "default"
    });
    expect(getExtension).toHaveBeenCalledWith("WEBGL_lose_context");
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it("rejects a missing WebGL2 context", () => {
    const canvas: WebGl2CanvasLike = {
      getContext: vi.fn(() => null)
    };

    expect(supportsWebGl2(() => canvas)).toBe(false);
  });

  it("rejects a context factory failure without exposing the error", () => {
    expect(supportsWebGl2(() => {
      throw new Error("driver detail");
    })).toBe(false);
  });
});

describe("staged cleanup", () => {
  it("runs every stage once and continues after a stage failure", () => {
    const calls: string[] = [];
    const marker = new Error("cleanup detail");
    const errors: unknown[] = [];
    const cleanup = createIdempotentCleanup([
      () => calls.push("stop loop"),
      () => {
        calls.push("dispose controls");
        throw marker;
      },
      () => calls.push("remove canvas")
    ], (error) => errors.push(error));

    cleanup();
    cleanup();

    expect(calls).toEqual(["stop loop", "dispose controls", "remove canvas"]);
    expect(errors).toEqual([marker]);
  });
});
