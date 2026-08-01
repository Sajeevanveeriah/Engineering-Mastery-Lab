import { describe, expect, it } from "vitest";
import {
  academyMediaByLessonId,
  academyMediaGaps,
  academyLegacyMediaRegistry,
  academyMediaPlacements,
  academyMediaRegistry,
  buildPrivacyEmbedUrl,
  getAcademyMedia,
  validateAcademyMediaProviderMetadata
} from "../data/academyMedia";
import { academySources } from "../data/academy/catalogue";
import { academyUnits } from "../data/academy/catalogue";
import {
  bindThirdPartyMediaFrameError,
  isThirdPartyMediaViewportEligible,
  thirdPartyMediaLifecycleReducer,
  type ThirdPartyMediaLifecycleState
} from "../components/ThirdPartyMedia";
import type { MediaSpec } from "../lib/academy/types";

describe("academy media manifest", () => {
  it("publishes one reviewed, auditable media placement for every Academy lesson", () => {
    const requiredLessonIds = academyUnits.flatMap((unit) => unit.lessonIds);
    const placementLessonIds = academyMediaPlacements.map(
      (placement) => placement.lessonId
    );

    expect(academyMediaPlacements).toHaveLength(175);
    expect(new Set(placementLessonIds).size).toBe(175);
    expect([...placementLessonIds].sort()).toEqual(
      [...requiredLessonIds].sort()
    );

    for (const placement of academyMediaPlacements) {
      expect(placement.mediaId.length).toBeGreaterThan(0);
      expect(placement.learningObjective.length).toBeGreaterThan(30);
      expect(placement.relevanceRationale.length).toBeGreaterThan(40);
      expect(placement.fallbackWrittenContentReference).toMatch(
        new RegExp(`^${placement.lessonId}-`)
      );
      expect(placement.reviewDate).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      expect(placement.reviewMethod.length).toBeGreaterThan(40);
      expect(placement.startSeconds).toBeGreaterThanOrEqual(0);
      if (placement.endSeconds !== null) {
        expect(placement.endSeconds).toBeGreaterThan(
          placement.startSeconds
        );
      }
      expect(getAcademyMedia(placement.mediaId)).not.toBeNull();
    }
  });

  it("contains unique, validated and captioned permitted media", () => {
    const ids = academyMediaRegistry.map((media) => media.id);
    const expectedAlternativeSourceIds: Record<string, string> = {
      "mit-calculus-course-introduction": "SRC-MIT-OCW-CALCULUS-REVISITED",
      "mit-calculus-chain-rule": "SRC-MIT-OCW-CALCULUS-REVISITED",
      "mit-calculus-inverse-differentiation": "SRC-MIT-OCW-CALCULUS-REVISITED",
      "mit-circuits-basic-analysis": "SRC-MIT-OCW-CIRCUITS-6002"
    };
    expect(new Set(ids).size).toBe(ids.length);
    expect(academyMediaRegistry).toHaveLength(164);

    for (const media of academyMediaRegistry) {
      expect(media.provider).toBe("youtube");
      expect(media.providerId).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(media.embedPermission).toBe("permitted");
      expect(media.captionsStatus).toBe("available");
      expect(media.lastValidated).toBe("2026-07-31");
      expect(media.durationMinutes).toBeGreaterThan(0);
      expect(media.nativeSummaryFallback.length).toBeGreaterThan(120);
      expect(media.offlineFallback.length).toBeGreaterThan(50);
      expect(media.alternativeSourceId).not.toBeNull();
      const alternative = academySources.find(
        (source) => source.id === media.alternativeSourceId
      );
      expect(alternative?.id).toBe(media.alternativeSourceId);
      expect(new URL(alternative?.url ?? "").protocol).toBe("https:");
    }

    for (const media of academyLegacyMediaRegistry) {
      expect(media.alternativeSourceId).toBe(
        expectedAlternativeSourceIds[media.id]
      );
      expect(media.alternativeSourceId).not.toBe("SRC-MIT-OCW");
      const alternative = academySources.find(
        (source) => source.id === media.alternativeSourceId
      );
      expect(alternative?.id).toBe(media.alternativeSourceId);
      expect(new URL(alternative?.url ?? "").protocol).toBe("https:");
      expect(new URL(alternative?.url ?? "").hostname).toBe("ocw.mit.edu");
    }
  });

  it("keeps the reviewed registry titles aligned with current provider metadata", () => {
    expect(
      getAcademyMedia("mit-calculus-chain-rule")?.title
    ).toBe("Unit II: Lec 3 | MIT Calculus Revisited: Single Variable Calculus");
    expect(
      getAcademyMedia("mit-calculus-inverse-differentiation")?.title
    ).toBe("Unit II: Lec 10 | MIT Calculus Revisited: Single Variable Calculus");
    expect(
      getAcademyMedia("mit-circuits-basic-analysis")?.title
    ).toBe("Lec 2 | MIT 6.002 Circuits and Electronics, Spring 2007");
  });

  it("fails metadata validation on a material title or creator mismatch", () => {
    const media = academyMediaRegistry[0];
    expect(validateAcademyMediaProviderMetadata(media, {
      title: media.title,
      author: media.creator
    })).toEqual({
      titleMatches: true,
      authorMatches: true
    });
    expect(validateAcademyMediaProviderMetadata(media, {
      title: "A different lesson",
      author: media.creator
    })).toEqual({
      titleMatches: false,
      authorMatches: true
    });
    expect(validateAcademyMediaProviderMetadata(media, {
      title: media.title,
      author: "Unreviewed Channel"
    })).toEqual({
      titleMatches: true,
      authorMatches: false
    });
  });

  it("maps every lesson media reference to a manifest entry", () => {
    for (const [lessonId, mediaIds] of Object.entries(academyMediaByLessonId)) {
      expect(lessonId).toMatch(/^EML-E[0-4]-D\d{2}-L0[1-7]$/);
      expect(mediaIds.length).toBeGreaterThan(0);
      for (const mediaId of mediaIds) {
        expect(getAcademyMedia(mediaId)).not.toBeNull();
      }
    }
  });

  it("accounts explicitly for every mapped lesson or release-blocking media gap", () => {
    const requiredLessonIds = academyUnits.flatMap((unit) => unit.lessonIds);
    const mappedLessonIds = Object.keys(academyMediaByLessonId);
    const gapLessonIds = academyMediaGaps.map((gap) => gap.lessonId);

    expect(requiredLessonIds).toHaveLength(175);
    expect(new Set(mappedLessonIds).size).toBe(mappedLessonIds.length);
    expect(new Set(gapLessonIds).size).toBe(gapLessonIds.length);
    expect(mappedLessonIds.filter((lessonId) => gapLessonIds.includes(lessonId))).toEqual([]);
    expect([...mappedLessonIds, ...gapLessonIds].sort()).toEqual(
      [...requiredLessonIds].sort()
    );
    for (const gap of academyMediaGaps) {
      expect(gap.status).toBe("MEDIA_GAP");
      expect(gap.reason.length).toBeGreaterThan(50);
      expect(gap.requiredAcceptanceTest.length).toBeGreaterThan(50);
    }
  });

  it("builds a privacy-enhanced, non-autoplay URL from a validated provider id", () => {
    const media = academyMediaRegistry[0];
    const value = buildPrivacyEmbedUrl(media);
    expect(value).not.toBeNull();
    const embedUrl = new URL(value!);
    expect(embedUrl.origin).toBe("https://www.youtube-nocookie.com");
    expect(embedUrl.pathname).toBe(`/embed/${media.providerId}`);
    expect(embedUrl.searchParams.get("cc_lang_pref")).toBe("en");
    expect(embedUrl.searchParams.get("cc_load_policy")).toBe("1");
    expect(embedUrl.searchParams.has("autoplay")).toBe(false);
    expect(embedUrl.searchParams.get("enablejsapi")).toBe("1");
  });

  it("withholds a provider player below its 200 by 200 pixel viewport minimum", () => {
    expect(isThirdPartyMediaViewportEligible(199.99)).toBe(false);
    expect(isThirdPartyMediaViewportEligible(200)).toBe(true);
    expect(isThirdPartyMediaViewportEligible(Number.NaN)).toBe(false);
  });

  it("adds only a validated caller origin and bounded playback resume position", () => {
    const media = academyMediaRegistry[0];
    const value = buildPrivacyEmbedUrl(media, {
      origin: "http://127.0.0.1:4173",
      resumeSeconds: 93.8
    });
    const embedUrl = new URL(value!);

    expect(embedUrl.searchParams.get("origin")).toBe("http://127.0.0.1:4173");
    expect(embedUrl.searchParams.get("start")).toBe("93");
    expect(
      new URL(buildPrivacyEmbedUrl(media, {
        origin: "javascript:alert(1)",
        resumeSeconds: -5
      })!).searchParams.has("origin")
    ).toBe(false);
  });

  it("rejects unpermitted providers and malformed ids", () => {
    const source = academyMediaRegistry[0];
    const blocked = { ...source, embedPermission: "blocked" } satisfies MediaSpec;
    const malformed = { ...source, providerId: "../escape" } satisfies MediaSpec;
    expect(buildPrivacyEmbedUrl(blocked)).toBeNull();
    expect(buildPrivacyEmbedUrl(malformed)).toBeNull();
  });
});

describe("third-party media failure lifecycle", () => {
  it("converts a native iframe error into an unmounted retryable lifecycle state", () => {
    const frame = new EventTarget();
    let state: ThirdPartyMediaLifecycleState = {
      loaded: true,
      loadFailed: false,
      playerReady: true
    };
    const detach = bindThirdPartyMediaFrameError(frame, () => {
      state = thirdPartyMediaLifecycleReducer(state, { type: "failure" });
    });

    frame.dispatchEvent(new Event("error"));
    expect(state).toEqual({
      loaded: false,
      loadFailed: true,
      playerReady: false
    });

    detach();
    state = thirdPartyMediaLifecycleReducer(state, { type: "load" });
    frame.dispatchEvent(new Event("error"));
    expect(state).toEqual({
      loaded: true,
      loadFailed: false,
      playerReady: false
    });
  });
});
