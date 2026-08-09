import {
  meshRenderTransferList,
  prepareMeshRender,
  MeshImportError,
  type MeshFormat,
  type MeshImportLimits,
  type MeshRenderPayload,
  type StlUnit
} from "./meshImport";

export interface MeshWorkerImportRequest {
  readonly type: "import";
  readonly requestId: string;
  readonly data: ArrayBuffer;
  readonly format?: MeshFormat;
  readonly stlUnit?: StlUnit;
  readonly limits?: Partial<MeshImportLimits>;
}

export interface MeshWorkerCancelRequest {
  readonly type: "cancel";
  readonly requestId: string;
}

export type MeshWorkerRequest = MeshWorkerImportRequest | MeshWorkerCancelRequest;

export interface MeshWorkerResult {
  readonly type: "result";
  readonly requestId: string;
  readonly summary: {
    readonly format: MeshFormat;
    readonly byteLength: number;
    readonly sha256: string;
    readonly sourceUnit: string;
    readonly millimetresPerUnit: number;
    readonly triangleCount?: number;
    readonly encoding?: "ascii" | "binary";
    readonly boundsMm: {
      readonly min: readonly [number, number, number];
      readonly max: readonly [number, number, number];
      readonly size: readonly [number, number, number];
    };
    readonly components: readonly { readonly objectId: string; readonly transform: readonly number[] }[];
    readonly materials: readonly { readonly name: string; readonly colour?: string; readonly triangleCount?: number }[];
    readonly payload: MeshRenderPayload;
    readonly referenceOnly: true;
  };
}

export interface MeshWorkerError {
  readonly type: "error";
  readonly requestId: string;
  readonly error: { readonly code: string; readonly message: string; readonly details: Readonly<Record<string, unknown>> };
}

export interface MeshWorkerCancelled {
  readonly type: "cancelled";
  readonly requestId: string;
}

export type MeshWorkerResponse = MeshWorkerResult | MeshWorkerError | MeshWorkerCancelled;

export interface MeshWorkerDispatch {
  readonly response: MeshWorkerResponse;
  readonly transferables: readonly ArrayBuffer[];
}

const controllers = new Map<string, AbortController>();

export async function processMeshWorkerRequest(request: MeshWorkerRequest): Promise<MeshWorkerResponse | undefined> {
  if (request.type === "cancel") {
    controllers.get(request.requestId)?.abort();
    return { type: "cancelled", requestId: request.requestId };
  }
  if (!request.requestId || controllers.has(request.requestId)) {
    return { type: "error", requestId: request.requestId, error: { code: "INVALID_REQUEST", message: "Mesh worker request identifier is missing or already active.", details: {} } };
  }
  const controller = new AbortController();
  controllers.set(request.requestId, controller);
  try {
    const imported = await prepareMeshRender(request.data, {
      format: request.format,
      stlUnit: request.stlUnit,
      limits: request.limits,
      signal: controller.signal
    });
    return {
      type: "result",
      requestId: request.requestId,
      summary: {
        format: imported.format,
        byteLength: imported.byteLength,
        sha256: imported.sha256,
        sourceUnit: imported.sourceUnit,
        millimetresPerUnit: imported.millimetresPerUnit,
        triangleCount: imported.triangleCount,
        encoding: imported.encoding,
        boundsMm: imported.boundsMm,
        components: imported.components,
        materials: imported.materials,
        payload: imported.payload,
        referenceOnly: true
      }
    };
  } catch (error) {
    if (error instanceof MeshImportError && error.code === "ABORTED") return { type: "cancelled", requestId: request.requestId };
    return {
      type: "error",
      requestId: request.requestId,
      error: error instanceof MeshImportError
        ? { code: error.code, message: error.message, details: error.details }
        : { code: "UNEXPECTED", message: error instanceof Error ? error.message : String(error), details: {} }
    };
  } finally {
    controllers.delete(request.requestId);
  }
}

export async function processMeshWorkerRequestWithTransferList(request: MeshWorkerRequest): Promise<MeshWorkerDispatch | undefined> {
  const response = await processMeshWorkerRequest(request);
  if (!response) return undefined;
  return {
    response,
    transferables: response.type === "result" ? meshRenderTransferList(response.summary.payload) : []
  };
}

const workerScope = globalThis as typeof globalThis & {
  postMessage?: (message: MeshWorkerResponse, transfer: readonly ArrayBuffer[]) => void;
  onmessage?: ((event: MessageEvent<MeshWorkerRequest>) => void) | null;
  document?: unknown;
};

if (typeof workerScope.postMessage === "function" && typeof workerScope.document === "undefined") {
  workerScope.onmessage = (event): void => {
    void processMeshWorkerRequestWithTransferList(event.data).then((dispatch) => {
      if (dispatch) workerScope.postMessage?.(dispatch.response, dispatch.transferables);
    });
  };
}
