import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  initialThirdPartyMediaLifecycleState,
  isTrustedYouTubePlayerMessage,
  parseYouTubePlayerMessage,
  shouldPollThirdPartyMedia,
  THIRD_PARTY_MEDIA_READY_TIMEOUT_MS,
  ThirdPartyMedia,
  thirdPartyMediaLifecycleReducer
} from "../components/ThirdPartyMedia";
import {
  academyMediaRegistry,
  buildPrivacyEmbedUrl
} from "../data/academyMedia";
import type { MediaSpec } from "../lib/academy/types";

const readWorkspaceFile = (relativePath: string): string =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

function cspDirectives(policy: string): Map<string, string[]> {
  return new Map(
    policy
      .split(";")
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...values] = directive.split(/\s+/);
        return [name, values];
      })
  );
}

describe("academy content security policy", () => {
  it("keeps the web shell self-contained and allow-lists only the privacy-enhanced player", () => {
    const html = readWorkspaceFile("../../index.html");
    const content = html.match(
      /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/
    )?.[1];

    expect(content).toBeDefined();
    const directives = cspDirectives(content as string);

    expect(directives.get("default-src")).toEqual(["'self'"]);
    expect(directives.get("script-src")).toEqual(["'self'"]);
    expect(directives.get("font-src")).toEqual(["'self'", "data:"]);
    expect(directives.get("frame-src")).toEqual([
      "https://www.youtube-nocookie.com"
    ]);
    expect(directives.get("object-src")).toEqual(["'none'"]);
    expect(directives.get("base-uri")).toEqual(["'self'"]);
    expect(directives.get("form-action")).toEqual(["'self'"]);
    expect(content).not.toContain("www.youtube.com");
    expect(html).toContain('<script src="%BASE_URL%theme-bootstrap.js"></script>');
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>\s*\S/);
  });

  it("applies the same frame boundary to the Tauri shell", () => {
    const config = JSON.parse(
      readWorkspaceFile("../../src-tauri/tauri.conf.json")
    ) as {
      app: {
        security: {
          csp: string;
          dangerousRemoteDomainIpcAccess?: unknown;
        };
      };
    };
    const directives = cspDirectives(config.app.security.csp);

    expect(directives.get("default-src")).toEqual(["'self'"]);
    expect(directives.get("script-src")).toEqual(["'self'"]);
    expect(directives.get("font-src")).toEqual(["'self'", "data:"]);
    expect(directives.get("frame-src")).toEqual([
      "https://www.youtube-nocookie.com"
    ]);
    expect(directives.get("object-src")).toEqual(["'none'"]);
    expect(config.app.security.csp).not.toContain("www.youtube.com");
    expect(config.app.security.dangerousRemoteDomainIpcAccess).toBeUndefined();
  });

  it("does not grant a remote iframe a Tauri capability scope", () => {
    const capability = JSON.parse(
      readWorkspaceFile("../../src-tauri/capabilities/default.json")
    ) as {
      windows: string[];
      permissions: string[];
      remote?: unknown;
    };
    const mediaSource = readWorkspaceFile("../components/ThirdPartyMedia.tsx");

    expect(capability.windows).toEqual(["main"]);
    expect(capability.remote).toBeUndefined();
    expect(capability.permissions).not.toContain("opener:default");
    expect(mediaSource).toContain(
      'sandbox="allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"'
    );
    expect(mediaSource).not.toContain("allow-top-navigation");
  });

  it("boots the saved version 5 theme without contacting a third party", () => {
    const script = readWorkspaceFile("../../public/theme-bootstrap.js");

    expect(script).toContain("engineering-mastery-lab/progress/v${version}");
    expect(script).toContain("for (const version of [5, 4])");
    expect(script).toContain("for (const version of [3, 2, 1])");
    expect(script).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket)\b/);
    expect(script).not.toMatch(/https?:\/\//);
  });
});

describe("academy media privacy boundary", () => {
  it("generates only caption-enabled privacy-enhanced YouTube embeds", () => {
    for (const media of academyMediaRegistry) {
      const embedUrl = buildPrivacyEmbedUrl(media);

      expect(embedUrl).not.toBeNull();
      const parsed = new URL(embedUrl as string);
      expect(parsed.origin).toBe("https://www.youtube-nocookie.com");
      expect(parsed.pathname).toBe(`/embed/${media.providerId}`);
      expect(parsed.searchParams.get("cc_lang_pref")).toBe("en");
      expect(parsed.searchParams.get("cc_load_policy")).toBe("1");
      expect(parsed.searchParams.get("playsinline")).toBe("1");
      expect(media.captionsStatus).toBe("available");
      expect(media.nativeSummaryFallback.trim().length).toBeGreaterThan(80);
      expect(media.offlineFallback.trim().length).toBeGreaterThan(40);
    }
  });

  it("refuses unreviewed providers, blocked embeds and malformed identifiers", () => {
    const source = academyMediaRegistry[0];
    const cases: MediaSpec[] = [
      { ...source, provider: "local" },
      { ...source, embedPermission: "blocked" },
      { ...source, providerId: "not-valid" }
    ];

    expect(cases.map((media) => buildPrivacyEmbedUrl(media))).toEqual([
      null,
      null,
      null
    ]);
  });

  it("renders a complete native fallback without a frame for blocked media", () => {
    const blocked: MediaSpec = {
      ...academyMediaRegistry[0],
      embedPermission: "blocked"
    };
    const html = renderToStaticMarkup(
      createElement(ThirdPartyMedia, { media: blocked })
    );

    expect(html).not.toContain("<iframe");
    expect(html).toContain("Embedded playback unavailable");
    expect(html).toContain("disabled");
    expect(html).toContain("Native lesson fallback");
    expect(html).toContain(blocked.nativeSummaryFallback);
    expect(html).toContain(blocked.offlineFallback);
    expect(html).toContain(blocked.attribution);
    expect(html).toContain("SRC-MIT-OCW-CALCULUS-REVISITED");
    expect(html).toContain(
      "https://ocw.mit.edu/courses/res-18-006-calculus-revisited-single-variable-calculus-fall-2010/"
    );
  });

  it("creates no provider frame before the learner gives explicit consent", () => {
    const html = renderToStaticMarkup(
      createElement(ThirdPartyMedia, { media: academyMediaRegistry[0] })
    );

    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("https://www.youtube-nocookie.com/embed/");
    expect(html).toContain("No player or provider request has been created");
    expect(html).toContain("Load optional video");
  });

  it("wires the iframe branch to consent for the current media identity", () => {
    const mediaSource = readWorkspaceFile("../components/ThirdPartyMedia.tsx");

    expect(mediaSource).toContain(
      "const [consentedMediaId, setConsentedMediaId] = useState<string | null>(null);"
    );
    expect(mediaSource).toContain(
      "const loadedForCurrentMedia = loaded && consentIsCurrent;"
    );
    expect(mediaSource).toContain(
      "{loadedForCurrentMedia && embedUrl && playerViewportEligible ? ("
    );
    expect(mediaSource).toContain("setConsentedMediaId(media.id);");
    expect(mediaSource).not.toContain(
      "{loaded && embedUrl && playerViewportEligible ? ("
    );
  });

  it("fails closed after the bounded readiness window and exposes retry state", () => {
    const loading = thirdPartyMediaLifecycleReducer(
      initialThirdPartyMediaLifecycleState,
      { type: "load" }
    );
    const failed = thirdPartyMediaLifecycleReducer(loading, { type: "failure" });

    expect(THIRD_PARTY_MEDIA_READY_TIMEOUT_MS).toBe(15_000);
    expect(failed).toEqual({
      loaded: false,
      loadFailed: true,
      playerReady: false
    });
  });

  it("accepts only exact-origin, exact-player ready and info messages", () => {
    expect(
      isTrustedYouTubePlayerMessage("https://www.youtube-nocookie.com", true)
    ).toBe(true);
    expect(
      isTrustedYouTubePlayerMessage("https://www.youtube.com", true)
    ).toBe(false);
    expect(
      isTrustedYouTubePlayerMessage("https://www.youtube-nocookie.com", false)
    ).toBe(false);
    expect(parseYouTubePlayerMessage('{"event":"onReady"}')).toEqual({
      event: "onReady"
    });
    expect(parseYouTubePlayerMessage({
      event: "infoDelivery",
      info: { currentTime: 12, duration: 60 }
    })).toEqual({
      event: "infoDelivery",
      info: { currentTime: 12, duration: 60 }
    });
    expect(parseYouTubePlayerMessage('{"event":"onStateChange"}')).toBeNull();
    expect(parseYouTubePlayerMessage("not-json")).toBeNull();
  });

  it("suspends polling unless the ready player is visible and onscreen", () => {
    const active = {
      loaded: true,
      playerReady: true,
      documentVisible: true,
      playerInViewport: true
    };

    expect(shouldPollThirdPartyMedia(active)).toBe(true);
    expect(shouldPollThirdPartyMedia({
      ...active,
      documentVisible: false
    })).toBe(false);
    expect(shouldPollThirdPartyMedia({
      ...active,
      playerInViewport: false
    })).toBe(false);
    expect(shouldPollThirdPartyMedia({
      ...active,
      playerReady: false
    })).toBe(false);
    expect(shouldPollThirdPartyMedia({
      ...active,
      loaded: false
    })).toBe(false);
  });
});
