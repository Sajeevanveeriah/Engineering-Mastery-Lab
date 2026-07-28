export interface WebGl2CanvasLike {
  getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null;
}

export type WebGl2CanvasFactory = () => WebGl2CanvasLike;

export function supportsWebGl2(
  createCanvas: WebGl2CanvasFactory = () => document.createElement("canvas")
): boolean {
  let context: WebGL2RenderingContext | null = null;

  try {
    context = createCanvas().getContext("webgl2", {
      alpha: false,
      antialias: true,
      powerPreference: "default"
    });
    return context !== null;
  } catch {
    return false;
  } finally {
    try {
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      // Releasing the transient preflight context is best effort.
    }
  }
}

export function createIdempotentCleanup(
  stages: ReadonlyArray<() => void>,
  onStageError?: (error: unknown) => void
): () => void {
  let complete = false;

  return () => {
    if (complete) return;
    complete = true;

    stages.forEach((stage) => {
      try {
        stage();
      } catch (error) {
        try {
          onStageError?.(error);
        } catch {
          // Cleanup must continue even when diagnostic reporting fails.
        }
      }
    });
  };
}
