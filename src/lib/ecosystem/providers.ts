import {
  aggregateCohortProgress,
  createSyntheticCohortFixture,
  validateCohortSnapshot,
  type CohortSnapshot,
  type PrivacySafeProgressAggregate
} from "./cohorts";
import {
  InMemorySyncStore,
  resolveSyncConflict,
  type ConflictResolutionInput,
  type SyncApplyResult,
  type SyncConflict,
  type SyncRecordEnvelope
} from "./records";
import {
  ECOSYSTEM_LIMITS,
  assertBoundedText,
  assertOpaqueIdentifier,
  assertSafeJsonValue,
  compareCanonicalText,
  type AssignmentId,
  type CohortId,
  type ContentId,
  type JsonObject,
  type PackId,
  type RecordId
} from "./validation";

export type EcosystemCapabilityId =
  | "identity"
  | "synchronisation"
  | "conflict-resolution"
  | "cohorts"
  | "collaboration"
  | "curated-content-packs"
  | "educator-analytics"
  | "billing";

export interface ProviderCapabilityState {
  id: EcosystemCapabilityId;
  status: "local-reference" | "provider-available" | "unavailable";
  executionBoundary: "local-memory" | "remote-provider" | "none";
  networkAccess: boolean;
  hostedService: boolean;
  dataUse:
    | "none"
    | "local-records"
    | "synthetic-fixtures"
    | "local-curated-content"
    | "provider-managed";
  explanation: string;
}

export type ProviderResult<T> =
  | { status: "ready"; value: T }
  | { status: "not-found" }
  | { status: "unavailable"; reason: string };

export interface SynchronisationProvider {
  readonly capability: ProviderCapabilityState;
  apply<T extends JsonObject>(record: SyncRecordEnvelope<T>): SyncApplyResult<T>;
  read<T extends JsonObject = JsonObject>(recordId: RecordId): SyncRecordEnvelope<T> | null;
  exportLocalState(exportedAt: string): string;
  recoverLocalState(serialized: string): void;
}

export interface ConflictResolutionProvider {
  readonly capability: ProviderCapabilityState;
  resolve<T extends JsonObject>(
    conflict: SyncConflict<T>,
    input: ConflictResolutionInput<T>
  ): SyncRecordEnvelope<T>;
}

export interface CohortProvider {
  readonly capability: ProviderCapabilityState;
  listCohortIds(): CohortId[];
  getSnapshot(cohortId: CohortId): ProviderResult<CohortSnapshot>;
}

export interface CollaborationWorkspaceRequest {
  projectRecordId: RecordId;
}

export interface CollaborationWorkspace {
  projectRecordId: RecordId;
  revision: number;
}

export interface CollaborationProvider {
  readonly capability: ProviderCapabilityState;
  requestWorkspace(
    request: CollaborationWorkspaceRequest
  ): ProviderResult<CollaborationWorkspace>;
}

export const CONTENT_PACK_SCHEMA_VERSION = 1 as const;

export interface CuratedContentPack {
  schemaVersion: typeof CONTENT_PACK_SCHEMA_VERSION;
  id: PackId;
  version: string;
  title: string;
  contentIds: ContentId[];
}

export interface CuratedContentPackProvider {
  readonly capability: ProviderCapabilityState;
  list(): CuratedContentPack[];
  get(packId: PackId): ProviderResult<CuratedContentPack>;
}

export interface EducatorAnalyticsProvider {
  readonly capability: ProviderCapabilityState;
  aggregateProgress(
    cohortId: CohortId,
    assignmentId: AssignmentId,
    minimumGroupSize?: number
  ): ProviderResult<PrivacySafeProgressAggregate>;
}

function localCapability(
  id: EcosystemCapabilityId,
  dataUse: ProviderCapabilityState["dataUse"],
  explanation: string
): ProviderCapabilityState {
  return {
    id,
    status: "local-reference",
    executionBoundary: "local-memory",
    networkAccess: false,
    hostedService: false,
    dataUse,
    explanation
  };
}

function unavailableCapability(
  id: EcosystemCapabilityId,
  explanation: string
): ProviderCapabilityState {
  return {
    id,
    status: "unavailable",
    executionBoundary: "none",
    networkAccess: false,
    hostedService: false,
    dataUse: "none",
    explanation
  };
}

export const hostedCapabilityStates: Readonly<
  Record<
    "identity" | "synchronisation" | "billing" | "collaboration" | "cohorts" | "educator-analytics",
    ProviderCapabilityState
  >
> = Object.freeze({
  identity: unavailableCapability(
    "identity",
    "Hosted identity is not connected. The local application does not offer sign-in."
  ),
  synchronisation: unavailableCapability(
    "synchronisation",
    "Hosted synchronisation is not connected. Local reference logic does not contact a cloud service."
  ),
  billing: unavailableCapability(
    "billing",
    "Hosted billing is not connected. The local application does not collect payment."
  ),
  collaboration: unavailableCapability(
    "collaboration",
    "Remote collaboration is not connected. No multi-user workspace is simulated."
  ),
  cohorts: unavailableCapability(
    "cohorts",
    "Hosted cohort services are not connected. Only synthetic local fixtures are available to tests."
  ),
  "educator-analytics": unavailableCapability(
    "educator-analytics",
    "Hosted educator analytics are not connected. No telemetry or real learner data is processed."
  )
});

export class InMemorySynchronisationProvider implements SynchronisationProvider {
  readonly capability = localCapability(
    "synchronisation",
    "local-records",
    "Deterministic local in-memory record handling only. This is not cloud synchronisation and collects no telemetry."
  );
  private store = new InMemorySyncStore();

  apply<T extends JsonObject>(record: SyncRecordEnvelope<T>): SyncApplyResult<T> {
    return this.store.apply(record);
  }

  read<T extends JsonObject = JsonObject>(recordId: RecordId): SyncRecordEnvelope<T> | null {
    return this.store.readActive<T>(recordId);
  }

  exportLocalState(exportedAt: string): string {
    return this.store.exportJson(exportedAt);
  }

  recoverLocalState(serialized: string): void {
    this.store = InMemorySyncStore.recover(serialized);
  }
}

export const localConflictResolutionProvider: ConflictResolutionProvider = {
  capability: localCapability(
    "conflict-resolution",
    "none",
    "Pure deterministic conflict resolution for local records only."
  ),
  resolve: resolveSyncConflict
};

export class SyntheticCohortProvider implements CohortProvider {
  readonly capability = localCapability(
    "cohorts",
    "synthetic-fixtures",
    "Deterministic synthetic cohort fixtures for local tests only. No real user data is accepted."
  );
  private readonly snapshots = new Map<string, CohortSnapshot>();

  constructor(snapshotValues: readonly CohortSnapshot[] = [createSyntheticCohortFixture()]) {
    if (snapshotValues.length > ECOSYSTEM_LIMITS.cohortsPerProvider) {
      throw new Error("synthetic cohort provider exceeds its fixture limit");
    }
    for (const snapshotValue of snapshotValues) {
      const snapshot = validateCohortSnapshot(snapshotValue);
      if (snapshot.dataClassification !== "synthetic-fixture") {
        throw new Error("synthetic cohort provider rejects provider-managed data");
      }
      if (this.snapshots.has(snapshot.cohort.id)) {
        throw new Error("synthetic cohort provider contains a duplicate cohort");
      }
      this.snapshots.set(snapshot.cohort.id, snapshot);
    }
  }

  listCohortIds(): CohortId[] {
    return [...this.snapshots.keys()]
      .sort()
      .map((id) => assertOpaqueIdentifier(id, "cohort"));
  }

  getSnapshot(cohortIdValue: CohortId): ProviderResult<CohortSnapshot> {
    const cohortId = assertOpaqueIdentifier(cohortIdValue, "cohort");
    const snapshot = this.snapshots.get(cohortId);
    return snapshot === undefined
      ? { status: "not-found" }
      : { status: "ready", value: validateCohortSnapshot(snapshot) };
  }
}

export class UnavailableCollaborationProvider implements CollaborationProvider {
  readonly capability = hostedCapabilityStates.collaboration;

  requestWorkspace(
    request: CollaborationWorkspaceRequest
  ): ProviderResult<CollaborationWorkspace> {
    assertOpaqueIdentifier(request.projectRecordId, "record");
    return { status: "unavailable", reason: this.capability.explanation };
  }
}

function validateContentPack(value: unknown): CuratedContentPack {
  const safe = assertSafeJsonValue(value, "curated content pack");
  if (safe === null || typeof safe !== "object" || Array.isArray(safe)) {
    throw new Error("curated content pack must be an object");
  }
  const allowedKeys = new Set(["schemaVersion", "id", "version", "title", "contentIds"]);
  for (const key of Object.keys(safe)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`curated content pack contains unsupported field ${key}`);
    }
  }
  if (safe.schemaVersion !== CONTENT_PACK_SCHEMA_VERSION) {
    throw new Error(`unsupported content pack schema version ${String(safe.schemaVersion)}`);
  }
  const id = assertOpaqueIdentifier(safe.id, "pack");
  if (
    typeof safe.version !== "string" ||
    safe.version.length > 32 ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(safe.version)
  ) {
    throw new Error("content pack version must be a stable semantic version");
  }
  const title = assertBoundedText(safe.title, "content pack title");
  if (!Array.isArray(safe.contentIds)) {
    throw new Error("content pack contentIds must be an array");
  }
  if (safe.contentIds.length > ECOSYSTEM_LIMITS.contentItemsPerPack) {
    throw new Error("content pack exceeds the content item limit");
  }
  const contentIds = safe.contentIds.map((contentId) =>
    assertOpaqueIdentifier(contentId, "content")
  );
  if (new Set(contentIds).size !== contentIds.length) {
    throw new Error("content pack contains duplicate content ids");
  }
  return {
    schemaVersion: CONTENT_PACK_SCHEMA_VERSION,
    id,
    version: safe.version,
    title,
    contentIds: [...contentIds].sort()
  };
}

export class InMemoryCuratedContentPackProvider
implements CuratedContentPackProvider {
  readonly capability = localCapability(
    "curated-content-packs",
    "local-curated-content",
    "Bounded curated content manifests stored in local memory. No remote catalogue is connected."
  );
  private readonly packs = new Map<string, CuratedContentPack>();

  constructor(packValues: readonly CuratedContentPack[]) {
    if (packValues.length > ECOSYSTEM_LIMITS.contentPacks) {
      throw new Error("curated content pack provider exceeds its pack limit");
    }
    for (const packValue of packValues) {
      const pack = validateContentPack(packValue);
      if (this.packs.has(pack.id)) {
        throw new Error("curated content pack provider contains a duplicate pack");
      }
      this.packs.set(pack.id, pack);
    }
  }

  list(): CuratedContentPack[] {
    return [...this.packs.values()]
      .sort((left, right) => compareCanonicalText(left.id, right.id))
      .map(validateContentPack);
  }

  get(packIdValue: PackId): ProviderResult<CuratedContentPack> {
    const packId = assertOpaqueIdentifier(packIdValue, "pack");
    const pack = this.packs.get(packId);
    return pack === undefined
      ? { status: "not-found" }
      : { status: "ready", value: validateContentPack(pack) };
  }
}

export class SyntheticEducatorAnalyticsProvider
implements EducatorAnalyticsProvider {
  readonly capability = localCapability(
    "educator-analytics",
    "synthetic-fixtures",
    "Privacy-thresholded aggregates over synthetic local fixtures only. No telemetry is collected."
  );

  constructor(private readonly cohorts: CohortProvider) {
    if (
      cohorts.capability.status !== "local-reference" ||
      cohorts.capability.executionBoundary !== "local-memory" ||
      cohorts.capability.dataUse !== "synthetic-fixtures"
    ) {
      throw new Error(
        "synthetic educator analytics accepts only local synthetic cohort fixtures"
      );
    }
  }

  aggregateProgress(
    cohortIdValue: CohortId,
    assignmentIdValue: AssignmentId,
    minimumGroupSize?: number
  ): ProviderResult<PrivacySafeProgressAggregate> {
    const cohortId = assertOpaqueIdentifier(cohortIdValue, "cohort");
    const assignmentId = assertOpaqueIdentifier(assignmentIdValue, "assignment");
    const snapshotResult = this.cohorts.getSnapshot(cohortId);
    if (snapshotResult.status !== "ready") return snapshotResult;
    if (snapshotResult.value.dataClassification !== "synthetic-fixture") {
      throw new Error("synthetic educator analytics rejects provider-managed data");
    }
    return {
      status: "ready",
      value: aggregateCohortProgress(
        snapshotResult.value,
        assignmentId,
        minimumGroupSize
      )
    };
  }
}

export function createLocalReferenceEcosystem(): {
  synchronisation: SynchronisationProvider;
  conflictResolution: ConflictResolutionProvider;
  cohorts: CohortProvider;
  collaboration: CollaborationProvider;
  contentPacks: CuratedContentPackProvider;
  educatorAnalytics: EducatorAnalyticsProvider;
} {
  const cohorts = new SyntheticCohortProvider();
  const contentPacks = new InMemoryCuratedContentPackProvider([
    {
      schemaVersion: CONTENT_PACK_SCHEMA_VERSION,
      id: assertOpaqueIdentifier("pack:aaaaaaaaaaaaaaab", "pack"),
      version: "1.0.0",
      title: "Synthetic engineering workflow pack",
      contentIds: [
        assertOpaqueIdentifier("content:aaaaaaaaaaaaaaab", "content"),
        assertOpaqueIdentifier("content:aaaaaaaaaaaaaaac", "content")
      ]
    }
  ]);
  return {
    synchronisation: new InMemorySynchronisationProvider(),
    conflictResolution: localConflictResolutionProvider,
    cohorts,
    collaboration: new UnavailableCollaborationProvider(),
    contentPacks,
    educatorAnalytics: new SyntheticEducatorAnalyticsProvider(cohorts)
  };
}
