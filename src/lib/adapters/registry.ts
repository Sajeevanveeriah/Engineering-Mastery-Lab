// Capability registry: one lookup surface for all adapters.

import { ADAPTER_CONTRACT_VERSION, AdapterInfo, Capability, EngineAdapter } from "./contract";

export class AdapterRegistry {
  private adapters = new Map<string, EngineAdapter>();

  register(adapter: EngineAdapter): void {
    if (adapter.contractVersion !== ADAPTER_CONTRACT_VERSION) {
      throw new Error(
        `Adapter rejected: contract version ${String(adapter.contractVersion)} is not supported ` +
          `(this build supports version ${ADAPTER_CONTRACT_VERSION}).`
      );
    }
    const info = adapter.describe();
    if (this.adapters.has(info.id)) {
      throw new Error(`Adapter rejected: duplicate id "${info.id}".`);
    }
    const seen = new Set<string>();
    for (const cap of info.capabilities) {
      if (!cap.id.startsWith(`${info.id}.`)) {
        throw new Error(`Adapter "${info.id}": capability "${cap.id}" must be namespaced "${info.id}.*".`);
      }
      if (seen.has(cap.id)) throw new Error(`Adapter "${info.id}": duplicate capability "${cap.id}".`);
      seen.add(cap.id);
    }
    this.adapters.set(info.id, adapter);
  }

  get(adapterId: string): EngineAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  list(): AdapterInfo[] {
    return [...this.adapters.values()].map((a) => a.describe()).sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Resolve the adapter that owns a capability id, e.g. "ngspice.tran" -> ngspice. */
  resolveCapability(capabilityId: string): { adapter: EngineAdapter; capability: Capability } | undefined {
    for (const adapter of this.adapters.values()) {
      const info = adapter.describe();
      const capability = info.capabilities.find((c) => c.id === capabilityId);
      if (capability) return { adapter, capability };
    }
    return undefined;
  }
}
