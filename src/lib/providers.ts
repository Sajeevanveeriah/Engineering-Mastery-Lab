import { emptyProgress, loadProgress, saveProgress, type LocalLearnerProfile, type ProgressState } from "./storage";
import { entitlementIds, type EntitlementId, type PlanId } from "../data/commercial";

export interface LearnerProvider {
  mode: "local-profile" | "hosted-account";
  getProfile(state: ProgressState): LocalLearnerProfile | null;
}

export interface ProgressProviderBoundary {
  mode: "local" | "hosted-sync";
  load(): ProgressState;
  save(state: ProgressState): boolean;
}

export interface EntitlementProvider {
  mode: "open-source-preview" | "hosted-plan";
  planId: PlanId | "open-source-preview";
  has(entitlement: EntitlementId): boolean;
}

export interface BillingAvailabilityProvider {
  available: boolean;
  explanation: string;
}

export interface ProductEventProvider {
  mode: "no-op" | "hosted";
  record(name: string, properties?: Record<string, string | number | boolean>): void;
}

export const localLearnerProvider: LearnerProvider = {
  mode: "local-profile",
  getProfile: (state) => state.profile
};

export const localProgressProvider: ProgressProviderBoundary = {
  mode: "local",
  load: loadProgress,
  save: saveProgress
};

export const openSourceEntitlementProvider: EntitlementProvider = {
  mode: "open-source-preview",
  planId: "open-source-preview",
  has: (entitlement) => entitlementIds.includes(entitlement)
};

export const localBillingProvider: BillingAvailabilityProvider = {
  available: false,
  explanation: "Hosted billing is not connected. This local open-source preview does not collect payment."
};

export const noOpProductEventProvider: ProductEventProvider = {
  mode: "no-op",
  record: () => undefined
};

export function createCleanLocalProgress(): ProgressState {
  return structuredClone(emptyProgress);
}
