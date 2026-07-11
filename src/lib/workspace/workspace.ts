// Workspace operations over the platform bridge: create, open, save.
// All writes go through the bridge's atomic write; the previous manifest is
// never truncated in place, so a failed write cannot lose data.

import { PlatformBridge } from "../platform/bridge";
import {
  createManifest,
  MANIFEST_FILENAME,
  parseManifest,
  serializeManifest,
  WORKSPACE_FOLDERS,
  WorkspaceManifest
} from "./manifest";

export interface OpenWorkspace {
  /** Absolute path of the workspace directory. */
  root: string;
  manifest: WorkspaceManifest;
}

export function nowUtc(): string {
  return new Date().toISOString();
}

/** Create a new workspace directory structure and manifest at `root`. */
export async function createWorkspace(
  bridge: PlatformBridge,
  root: string,
  name: string,
  description: string
): Promise<OpenWorkspace> {
  if (await bridge.fileExists(root, MANIFEST_FILENAME)) {
    throw new Error(`A workspace already exists at this location (${MANIFEST_FILENAME} found). Open it instead.`);
  }
  const manifest = createManifest(name, description, nowUtc());
  for (const folder of WORKSPACE_FOLDERS) {
    await bridge.createDirAll(root, folder);
  }
  await bridge.writeTextFileAtomic(root, MANIFEST_FILENAME, serializeManifest(manifest));
  return { root, manifest };
}

/** Open an existing workspace; throws ManifestError with actionable messages. */
export async function openWorkspace(bridge: PlatformBridge, root: string): Promise<OpenWorkspace> {
  if (!(await bridge.fileExists(root, MANIFEST_FILENAME))) {
    throw new Error(
      `No ${MANIFEST_FILENAME} found in the selected folder. Choose a workspace directory or create a new project.`
    );
  }
  const json = await bridge.readTextFile(root, MANIFEST_FILENAME);
  const manifest = parseManifest(json);
  return { root, manifest };
}

/** Persist the manifest, bumping modifiedUtc. Returns the saved manifest. */
export async function saveWorkspace(bridge: PlatformBridge, ws: OpenWorkspace): Promise<WorkspaceManifest> {
  const manifest: WorkspaceManifest = { ...ws.manifest, modifiedUtc: nowUtc() };
  await bridge.writeTextFileAtomic(ws.root, MANIFEST_FILENAME, serializeManifest(manifest));
  return manifest;
}

// --- Recent projects (UI state; stored outside the workspace) ---

export interface RecentProject {
  root: string;
  name: string;
  openedUtc: string;
}

const RECENT_KEY = "engineering-workbench/recent-projects/v1";
const RECENT_LIMIT = 8;

export function loadRecentProjects(storage: Pick<Storage, "getItem" | "setItem"> = localStorage): RecentProject[] {
  try {
    const raw = storage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is RecentProject =>
        typeof p === "object" && p !== null &&
        typeof (p as RecentProject).root === "string" &&
        typeof (p as RecentProject).name === "string" &&
        typeof (p as RecentProject).openedUtc === "string"
    );
  } catch {
    return [];
  }
}

export function rememberRecentProject(
  project: Omit<RecentProject, "openedUtc">,
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage
): RecentProject[] {
  const entry: RecentProject = { ...project, openedUtc: nowUtc() };
  const rest = loadRecentProjects(storage).filter((p) => p.root !== entry.root);
  const next = [entry, ...rest].slice(0, RECENT_LIMIT);
  try {
    storage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable; recents are a convenience only.
  }
  return next;
}
