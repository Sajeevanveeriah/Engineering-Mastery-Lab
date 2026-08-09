import singleWasmUrl from "replicad-opencascadejs/src/replicad_single.wasm?url";
import {
  BREP_WASM_BASENAME,
  brepTransferables,
  createBrepRuntime,
  parseBrepWorkerRequest,
  type BrepError,
  type BrepWorkerRequest,
  type BrepWorkerResponse
} from "./brep";

interface WorkerScope {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: BrepWorkerResponse, transfer?: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;
const controllers = new Map<string, AbortController>();
let runtimePromise: ReturnType<typeof createBrepRuntime> | undefined;

function post(message: BrepWorkerResponse, transfer: Transferable[] = []): void {
  scope.postMessage(message, transfer);
}

function progress(
  jobId: string,
  phase: Extract<BrepWorkerResponse, { kind: "progress" }>["phase"],
  ratio: number
): void {
  post({ kind: "progress", jobId, phase, ratio });
}

async function runtime(jobId: string) {
  if (!runtimePromise) {
    if (!singleWasmUrl.includes(BREP_WASM_BASENAME.replace(".wasm", "")) || singleWasmUrl.includes("exceptions")) {
      throw new Error(`Unexpected OCCT payload: ${singleWasmUrl}`);
    }
    progress(jobId, "initialising", 0.05);
    runtimePromise = createBrepRuntime({ wasmUrl: singleWasmUrl });
  }
  return runtimePromise;
}

async function yieldForCancellation(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function execute(request: Exclude<BrepWorkerRequest, { kind: "cancel" }>): Promise<void> {
  const controller = new AbortController();
  controllers.set(request.jobId, controller);
  let engine: Awaited<ReturnType<typeof createBrepRuntime>>;
  try {
    engine = await runtime(request.jobId);
  } catch (error) {
    post({
      kind: "error",
      jobId: request.jobId,
      error: {
        code: "INITIALISATION_FAILED",
        message: `${error instanceof Error ? error.message : String(error)} The failed OCCT worker must be replaced before retrying.`,
        recoverable: false,
        recovery: "replace-worker"
      }
    });
    controllers.delete(request.jobId);
    return;
  }
  try {
    await yieldForCancellation();
    if (controller.signal.aborted) throw new DOMException("B-rep job was cancelled", "AbortError");
    if (request.kind === "evaluate") {
      progress(request.jobId, "validating", 0.25);
      progress(request.jobId, "modelling", 0.45);
      const result = await engine.evaluate(request.document, controller.signal);
      progress(request.jobId, "meshing", 0.9);
      post({ kind: "evaluation", jobId: request.jobId, result }, brepTransferables(result));
      return;
    }
    if (request.kind === "export") {
      progress(request.jobId, "modelling", 0.35);
      const result = await engine.export(request.document, request.format, controller.signal);
      progress(request.jobId, "serialising", 0.9);
      post({ kind: "export", jobId: request.jobId, result }, brepTransferables(result));
      return;
    }
    progress(request.jobId, "validating", 0.2);
    const result = await engine.import(request.format, request.bytes, controller.signal);
    progress(request.jobId, "meshing", 0.9);
    post({ kind: "import", jobId: request.jobId, result }, brepTransferables(result));
  } catch (error) {
    const cancelled = error instanceof DOMException && error.name === "AbortError";
    const structured: BrepError = {
      code: cancelled ? "CANCELLED" : "FEATURE_FAILED",
      message: error instanceof Error ? error.message : String(error),
      recoverable: true,
      recovery: "retry-job"
    };
    post({ kind: "error", jobId: request.jobId, error: structured });
  } finally {
    controllers.delete(request.jobId);
  }
}

scope.onmessage = (event) => {
  const parsed = parseBrepWorkerRequest(event.data);
  if (!parsed.ok) {
    post({ kind: "error", jobId: parsed.jobId, error: parsed.error });
    return;
  }
  const request = parsed.request;
  if (request.kind === "cancel") {
    controllers.get(request.jobId)?.abort();
    return;
  }
  void execute(request);
};
