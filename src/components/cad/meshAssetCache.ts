export const MESH_ASSET_CACHE_DB = "engineering-workbench-cad-assets";
export const MESH_ASSET_CACHE_STORE = "mesh-assets";
export const MESH_ASSET_CACHE_MAX_BYTES = 64 * 1024 * 1024;

interface CachedMeshAsset {
  readonly sha256: string;
  readonly name: string;
  readonly format: "stl" | "3mf";
  readonly sourceUnit: string;
  readonly byteLength: number;
  readonly blob: Blob;
}

export class MeshAssetCacheError extends Error {
  constructor(readonly code: "CACHE_LIMIT" | "CACHE_QUOTA" | "CACHE_UNAVAILABLE", message: string) {
    super(message);
    this.name = "MeshAssetCacheError";
  }
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function openCache(): Promise<IDBDatabase> {
  if (!("indexedDB" in globalThis)) return Promise.reject(new MeshAssetCacheError("CACHE_UNAVAILABLE", "IndexedDB is unavailable in this browser profile."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MESH_ASSET_CACHE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(MESH_ASSET_CACHE_STORE, { keyPath: "sha256" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new MeshAssetCacheError("CACHE_UNAVAILABLE", request.error?.message ?? "The browser asset cache could not be opened."));
  });
}

async function cachedBytes(store: IDBObjectStore): Promise<number> {
  return new Promise((resolve, reject) => {
    let total = 0;
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const item = cursor.result;
      if (!item) { resolve(total); return; }
      total += Number((item.value as CachedMeshAsset).byteLength) || 0;
      item.continue();
    };
    cursor.onerror = () => reject(cursor.error ?? new Error("The browser asset cache could not be measured."));
  });
}

export async function cacheMeshAsset(asset: CachedMeshAsset): Promise<"stored" | "deduplicated"> {
  if (asset.byteLength > MESH_ASSET_CACHE_MAX_BYTES) throw new MeshAssetCacheError("CACHE_LIMIT", "The mesh exceeds the 64 MiB browser-profile cache ceiling.");
  const database = await openCache();
  try {
    const existing = await requestResult(database.transaction(MESH_ASSET_CACHE_STORE).objectStore(MESH_ASSET_CACHE_STORE).get(asset.sha256)) as CachedMeshAsset | undefined;
    if (existing) return "deduplicated";
    const read = database.transaction(MESH_ASSET_CACHE_STORE, "readonly").objectStore(MESH_ASSET_CACHE_STORE);
    if (await cachedBytes(read) + asset.byteLength > MESH_ASSET_CACHE_MAX_BYTES) throw new MeshAssetCacheError("CACHE_LIMIT", "The 64 MiB browser-profile mesh cache is full.");
    const transaction = database.transaction(MESH_ASSET_CACHE_STORE, "readwrite");
    transaction.objectStore(MESH_ASSET_CACHE_STORE).add(asset);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    return "stored";
  } catch (error) {
    if (error instanceof MeshAssetCacheError) throw error;
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "UnknownError")) {
      throw new MeshAssetCacheError("CACHE_QUOTA", "The browser profile refused the mesh cache write because its storage quota was reached.");
    }
    throw new MeshAssetCacheError("CACHE_UNAVAILABLE", error instanceof Error ? error.message : "The browser asset cache write failed.");
  } finally {
    database.close();
  }
}

export async function readMeshAsset(sha256: string): Promise<CachedMeshAsset | null> {
  const database = await openCache();
  try {
    return await requestResult(database.transaction(MESH_ASSET_CACHE_STORE).objectStore(MESH_ASSET_CACHE_STORE).get(sha256)) as CachedMeshAsset | undefined ?? null;
  } finally {
    database.close();
  }
}

export async function clearMeshAssetCache(): Promise<number> {
  const database = await openCache();
  try {
    const transaction = database.transaction(MESH_ASSET_CACHE_STORE, "readwrite");
    const store = transaction.objectStore(MESH_ASSET_CACHE_STORE);
    let removedCount = 0;
    await new Promise<void>((resolve, reject) => {
      const count = store.count();
      count.onsuccess = () => {
        removedCount = count.result;
        store.clear();
      };
      count.onerror = () => reject(count.error ?? new Error("The browser asset cache count failed."));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("The browser asset cache clear failed."));
      transaction.onabort = () => reject(transaction.error ?? new Error("The browser asset cache clear was aborted."));
    });
    return removedCount;
  } catch (error) {
    if (error instanceof MeshAssetCacheError) throw error;
    throw new MeshAssetCacheError("CACHE_UNAVAILABLE", error instanceof Error ? error.message : "The browser asset cache could not be cleared.");
  } finally {
    database.close();
  }
}
