import { describe, expect, it, vi } from "vitest";
import {
  createLocalScaleFoundationProviders,
  localBillingProvider,
  localLearnerProvider,
  localProgressProvider,
  noOpProductEventProvider
} from "../lib/providers";

describe("existing provider boundaries and local scale foundations", () => {
  it("keeps identity, hosted synchronisation and billing honestly unavailable", () => {
    expect(localLearnerProvider).toMatchObject({
      mode: "local-profile",
      identityCapability: {
        status: "unavailable",
        networkAccess: false,
        hostedService: false
      }
    });
    expect(localProgressProvider.hostedSynchronisationCapability).toMatchObject({
      status: "unavailable",
      networkAccess: false,
      hostedService: false
    });
    expect(localBillingProvider).toMatchObject({
      available: false,
      capability: {
        status: "unavailable",
        networkAccess: false,
        hostedService: false
      }
    });
  });

  it("provides local-only scale contracts without collecting product events", () => {
    const eventSpy = vi.fn(noOpProductEventProvider.record);
    eventSpy("fixture-reviewed", { local: true });
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(noOpProductEventProvider.telemetryCollected).toBe(false);

    const providers = createLocalScaleFoundationProviders();
    expect(providers.synchronisation.capability).toMatchObject({
      status: "local-reference",
      executionBoundary: "local-memory",
      networkAccess: false,
      hostedService: false
    });
    expect(providers.collaboration.capability.status).toBe("unavailable");
    expect(providers.cohorts.capability.dataUse).toBe("synthetic-fixtures");
    expect(providers.educatorAnalytics.capability.dataUse).toBe("synthetic-fixtures");
  });
});
