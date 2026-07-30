import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from "react";
import type { MediaSpec } from "../lib/academy/types";
import {
  buildPrivacyEmbedUrl,
  YOUTUBE_PRIVACY_ORIGIN
} from "../data/academyMedia";
import { academySources } from "../data/academy/catalogue";

export const THIRD_PARTY_MEDIA_READY_TIMEOUT_MS = 15_000;
export const THIRD_PARTY_MEDIA_MIN_VIEWPORT_PIXELS = 200;
const THIRD_PARTY_MEDIA_FRAME_HORIZONTAL_BORDER_PIXELS = 2;

export function isThirdPartyMediaViewportEligible(widthPixels: number): boolean {
  return Number.isFinite(widthPixels)
    && widthPixels >= THIRD_PARTY_MEDIA_MIN_VIEWPORT_PIXELS;
}

export function isThirdPartyMediaConsentCurrent(
  consentedMediaId: string | null,
  currentMediaId: string
): boolean {
  return consentedMediaId !== null && consentedMediaId === currentMediaId;
}

function cssPixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function availableThirdPartyMediaViewportWidth(root: HTMLElement): number {
  const styles = window.getComputedStyle(root);
  const containerInsets = cssPixels(styles.paddingLeft)
    + cssPixels(styles.paddingRight)
    + cssPixels(styles.borderLeftWidth)
    + cssPixels(styles.borderRightWidth);
  return Math.max(
    0,
    root.getBoundingClientRect().width
      - containerInsets
      - THIRD_PARTY_MEDIA_FRAME_HORIZONTAL_BORDER_PIXELS
  );
}

const academyMediaAlternativeSourceById = new Map(
  academySources.map((source) => [source.id, source])
);

export function getAcademyMediaAlternativeSource(media: MediaSpec) {
  if (media.alternativeSourceId === null) return null;
  const source = academyMediaAlternativeSourceById.get(media.alternativeSourceId);
  if (!source) return null;
  try {
    if (new URL(source.url).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return source;
}

export interface ThirdPartyMediaProps {
  media: MediaSpec;
  initialPositionSeconds?: number;
  onPositionChange?: (positionSeconds: number, durationSeconds: number | null) => void;
}

export type YouTubePlayerMessage =
  | {
      event: "onReady";
    }
  | {
      event: "infoDelivery";
      info: {
        currentTime?: number;
        duration?: number;
      };
    };

export function parseYouTubePlayerMessage(data: unknown): YouTubePlayerMessage | null {
  try {
    const value = typeof data === "string" ? JSON.parse(data) as unknown : data;
    if (
      value === null
      || typeof value !== "object"
      || !("event" in value)
    ) {
      return null;
    }
    if (value.event === "onReady") {
      return { event: "onReady" };
    }
    if (
      value.event !== "infoDelivery"
      || !("info" in value)
      || value.info === null
      || typeof value.info !== "object"
    ) {
      return null;
    }
    return value as YouTubePlayerMessage;
  } catch {
    return null;
  }
}

export function isTrustedYouTubePlayerMessage(
  origin: string,
  sourceMatchesPlayer: boolean
): boolean {
  return origin === YOUTUBE_PRIVACY_ORIGIN && sourceMatchesPlayer;
}

export function shouldPollThirdPartyMedia({
  loaded,
  playerReady,
  documentVisible,
  playerInViewport
}: {
  loaded: boolean;
  playerReady: boolean;
  documentVisible: boolean;
  playerInViewport: boolean;
}): boolean {
  return loaded && playerReady && documentVisible && playerInViewport;
}

export function bindThirdPartyMediaFrameError(
  target: EventTarget,
  onFailure: () => void
): () => void {
  const handleError = () => onFailure();
  target.addEventListener("error", handleError);
  return () => target.removeEventListener("error", handleError);
}

export interface ThirdPartyMediaLifecycleState {
  loaded: boolean;
  loadFailed: boolean;
  playerReady: boolean;
}

export type ThirdPartyMediaLifecycleAction =
  | { type: "load" }
  | { type: "ready" }
  | { type: "failure" }
  | { type: "reset" };

export const initialThirdPartyMediaLifecycleState: ThirdPartyMediaLifecycleState = {
  loaded: false,
  loadFailed: false,
  playerReady: false
};

export function thirdPartyMediaLifecycleReducer(
  state: ThirdPartyMediaLifecycleState,
  action: ThirdPartyMediaLifecycleAction
): ThirdPartyMediaLifecycleState {
  switch (action.type) {
    case "load":
      return { loaded: true, loadFailed: false, playerReady: false };
    case "ready":
      return state.loaded
        ? { loaded: true, loadFailed: false, playerReady: true }
        : state;
    case "failure":
      return { loaded: false, loadFailed: true, playerReady: false };
    case "reset":
      return initialThirdPartyMediaLifecycleState;
  }
}

export function ThirdPartyMedia({
  media,
  initialPositionSeconds = 0,
  onPositionChange
}: ThirdPartyMediaProps) {
  const [
    { loaded, loadFailed, playerReady },
    dispatchLifecycle
  ] = useReducer(
    thirdPartyMediaLifecycleReducer,
    initialThirdPartyMediaLifecycleState
  );
  const [consentedMediaId, setConsentedMediaId] = useState<string | null>(null);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document !== "undefined" && document.visibilityState === "visible"
  );
  const [playerInViewport, setPlayerInViewport] = useState(false);
  const [playerViewportEligible, setPlayerViewportEligible] = useState(true);
  const [resumePositionSeconds, setResumePositionSeconds] = useState(
    Math.max(0, initialPositionSeconds)
  );
  const mediaRootRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mediaViewportRef = useRef<HTMLDivElement>(null);
  const playerReadyRef = useRef(false);
  const initialSeekApplied = useRef(false);
  const readinessRemainingMilliseconds = useRef(
    THIRD_PARTY_MEDIA_READY_TIMEOUT_MS
  );
  const lastRecordedPosition = useRef(Math.max(0, initialPositionSeconds));
  const latestInitialPosition = useRef(initialPositionSeconds);
  latestInitialPosition.current = initialPositionSeconds;
  const callerOrigin = typeof window === "undefined" ? null : window.location.origin;
  const alternativeSource = useMemo(
    () => getAcademyMediaAlternativeSource(media),
    [media]
  );
  const embedUrl = useMemo(
    () => buildPrivacyEmbedUrl(media, {
      origin: callerOrigin,
      resumeSeconds: resumePositionSeconds
    }),
    [callerOrigin, media, resumePositionSeconds]
  );
  const canLoad = embedUrl !== null && playerViewportEligible;
  const consentIsCurrent = isThirdPartyMediaConsentCurrent(
    consentedMediaId,
    media.id
  );
  const loadedForCurrentMedia = loaded && consentIsCurrent;
  const loadFailedForCurrentMedia = loadFailed && consentIsCurrent;

  useEffect(() => {
    const root = mediaRootRef.current;
    if (!root) return;
    const updateEligibility = () => {
      setPlayerViewportEligible(
        isThirdPartyMediaViewportEligible(
          availableThirdPartyMediaViewportWidth(root)
        )
      );
    };
    updateEligibility();
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(updateEligibility);
      observer.observe(root);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", updateEligibility);
    return () => window.removeEventListener("resize", updateEligibility);
  }, []);

  useEffect(() => {
    const nextPosition = Math.max(0, latestInitialPosition.current);
    setConsentedMediaId(null);
    dispatchLifecycle({ type: "reset" });
    setPlayerInViewport(false);
    setResumePositionSeconds(nextPosition);
    playerReadyRef.current = false;
    initialSeekApplied.current = false;
    readinessRemainingMilliseconds.current =
      THIRD_PARTY_MEDIA_READY_TIMEOUT_MS;
    lastRecordedPosition.current = nextPosition;
  }, [media.id]);

  const handleLoadFailure = useCallback(() => {
    setResumePositionSeconds(lastRecordedPosition.current);
    dispatchLifecycle({ type: "failure" });
    setPlayerInViewport(false);
    playerReadyRef.current = false;
    initialSeekApplied.current = false;
    readinessRemainingMilliseconds.current = 0;
  }, []);

  useEffect(() => {
    if (playerViewportEligible || !loadedForCurrentMedia) return;
    setResumePositionSeconds(lastRecordedPosition.current);
    setConsentedMediaId(null);
    dispatchLifecycle({ type: "reset" });
    setPlayerInViewport(false);
    playerReadyRef.current = false;
    initialSeekApplied.current = false;
    readinessRemainingMilliseconds.current =
      THIRD_PARTY_MEDIA_READY_TIMEOUT_MS;
  }, [loadedForCurrentMedia, playerViewportEligible]);

  useEffect(() => {
    if (!loadedForCurrentMedia) return;
    const frame = iframeRef.current;
    if (!frame) return;
    return bindThirdPartyMediaFrameError(frame, handleLoadFailure);
  }, [handleLoadFailure, loadedForCurrentMedia]);

  useEffect(() => {
    if (!loadedForCurrentMedia) return;
    const onMessage = (event: MessageEvent) => {
      const playerWindow = iframeRef.current?.contentWindow ?? null;
      if (!isTrustedYouTubePlayerMessage(
        event.origin,
        playerWindow !== null && event.source === playerWindow
      )) return;
      const delivery = parseYouTubePlayerMessage(event.data);
      if (!delivery) return;

      if (!playerReadyRef.current) {
        playerReadyRef.current = true;
        dispatchLifecycle({ type: "ready" });
      }
      if (
        !initialSeekApplied.current
        && resumePositionSeconds > 0
        && iframeRef.current?.contentWindow
      ) {
        initialSeekApplied.current = true;
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "seekTo",
            args: [Math.floor(resumePositionSeconds), true]
          }),
          YOUTUBE_PRIVACY_ORIGIN
        );
      }
      if (delivery.event !== "infoDelivery" || !onPositionChange) return;
      const currentTime = delivery?.info.currentTime;
      if (
        currentTime === undefined
        || !Number.isFinite(currentTime)
        || currentTime < 0
        || Math.abs(currentTime - lastRecordedPosition.current) < 5
      ) return;
      const duration = delivery?.info.duration;
      const durationSeconds = duration !== undefined && Number.isFinite(duration) && duration > 0
        ? duration
        : media.durationMinutes === null
          ? null
          : Math.round(media.durationMinutes * 60);
      lastRecordedPosition.current = currentTime;
      onPositionChange(Math.floor(currentTime), durationSeconds);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    loadedForCurrentMedia,
    media.durationMinutes,
    onPositionChange,
    resumePositionSeconds
  ]);

  useEffect(() => {
    const updateVisibility = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!loadedForCurrentMedia) return;
    const target = mediaViewportRef.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      let frameRequest = 0;
      const updateViewport = () => {
        const bounds = target.getBoundingClientRect();
        setPlayerInViewport(
          bounds.bottom > 0
          && bounds.right > 0
          && bounds.top < window.innerHeight
          && bounds.left < window.innerWidth
        );
      };
      const scheduleViewportUpdate = () => {
        window.cancelAnimationFrame(frameRequest);
        frameRequest = window.requestAnimationFrame(updateViewport);
      };
      scheduleViewportUpdate();
      window.addEventListener("resize", scheduleViewportUpdate);
      window.addEventListener("scroll", scheduleViewportUpdate, true);
      return () => {
        window.cancelAnimationFrame(frameRequest);
        window.removeEventListener("resize", scheduleViewportUpdate);
        window.removeEventListener("scroll", scheduleViewportUpdate, true);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => setPlayerInViewport(
        entry?.isIntersecting === true && entry.intersectionRatio > 0
      ),
      { threshold: 0.01 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadedForCurrentMedia, media.id]);

  useEffect(() => {
    if (
      !loadedForCurrentMedia
      || playerReady
      || !documentVisible
      || !playerInViewport
    ) return;
    const startedAt = Date.now();
    const timeout = window.setTimeout(
      handleLoadFailure,
      readinessRemainingMilliseconds.current
    );
    return () => {
      window.clearTimeout(timeout);
      if (!playerReadyRef.current) {
        readinessRemainingMilliseconds.current = Math.max(
          0,
          readinessRemainingMilliseconds.current - (Date.now() - startedAt)
        );
      }
    };
  }, [
    documentVisible,
    handleLoadFailure,
    loadedForCurrentMedia,
    playerInViewport,
    playerReady
  ]);

  const pollingAllowed = shouldPollThirdPartyMedia({
    loaded: loadedForCurrentMedia,
    playerReady,
    documentVisible,
    playerInViewport
  });

  useEffect(() => {
    if (!pollingAllowed || !onPositionChange) return;
    const requestCurrentTime = () => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }),
        YOUTUBE_PRIVACY_ORIGIN
      );
    };
    requestCurrentTime();
    const interval = window.setInterval(() => {
      requestCurrentTime();
    }, 5_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [onPositionChange, pollingAllowed]);

  const startPlayerApi = () => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      JSON.stringify({ event: "listening", id: media.id }),
      YOUTUBE_PRIVACY_ORIGIN
    );
    frame.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "getPlayerState", args: [] }),
      YOUTUBE_PRIVACY_ORIGIN
    );
  };

  return (
    <section
      ref={mediaRootRef}
      className="academy-media"
      aria-labelledby={`${media.id}-title`}
    >
      <div className="academy-media__heading">
        <div>
          <p className="eyebrow">Optional external teaching</p>
          <h3 id={`${media.id}-title`}>{media.title}</h3>
          <p>{media.learningOutcome}</p>
        </div>
        <span className="badge">
          {media.captionsStatus === "available" ? "Captions available" : "Caption status unverified"}
        </span>
      </div>

      {loadedForCurrentMedia && embedUrl && playerViewportEligible ? (
        <div className="academy-media__loaded">
          {!playerReady && (
            <p role="status">
              Connecting to the optional player. If it is not ready within 15 seconds,
              the frame will be removed and the reviewed alternative will remain available.
            </p>
          )}
          <div className="academy-media__frame" ref={mediaViewportRef}>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={`${media.title}, optional video`}
              loading="lazy"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
              allow="encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              onLoad={startPlayerApi}
              onError={handleLoadFailure}
            />
          </div>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setResumePositionSeconds(lastRecordedPosition.current);
              setConsentedMediaId(null);
              dispatchLifecycle({ type: "reset" });
              setPlayerInViewport(false);
              playerReadyRef.current = false;
              initialSeekApplied.current = false;
              readinessRemainingMilliseconds.current =
                THIRD_PARTY_MEDIA_READY_TIMEOUT_MS;
            }}
          >
            Unload video and clear frame
          </button>
        </div>
      ) : (
        <div className="academy-media__consent">
          <div className="academy-media__placeholder" aria-hidden="true">
            <span>MIT</span>
            <strong>Optional video</strong>
          </div>
          <div>
            {loadFailedForCurrentMedia && (
              <div role="alert">
                <p>
                  The embedded player could not be loaded. Continue with the complete native lesson
                  and reviewed summary fallback, or retry when the provider is available.
                </p>
                <p>{media.nativeSummaryFallback}</p>
                <p><strong>Offline:</strong> {media.offlineFallback}</p>
                {alternativeSource && (
                  <p>
                    <a
                      href={alternativeSource.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Open the reviewed {alternativeSource.organisation} alternative
                    </a>
                  </p>
                )}
              </div>
            )}
            {!canLoad && alternativeSource && (
              <p>
                Embedded playback is unavailable.{" "}
                <a
                  href={alternativeSource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open the reviewed {alternativeSource.organisation} alternative
                </a>
              </p>
            )}
            {!playerViewportEligible && (
              <p role="status">
                Embedded playback is withheld because this layout cannot provide the
                provider's minimum 200 by 200 pixel player viewport. The complete native
                lesson and reviewed summary remain available.
              </p>
            )}
            <p>
              No player or provider request has been created. Loading sends your IP address and normal
              browser request data to YouTube. The privacy-enhanced player does not autoplay.
            </p>
            <button
              className="btn"
              type="button"
              disabled={!canLoad}
              onClick={() => {
                const root = mediaRootRef.current;
                if (
                  !root
                  || !isThirdPartyMediaViewportEligible(
                    availableThirdPartyMediaViewportWidth(root)
                  )
                ) {
                  setPlayerViewportEligible(false);
                  setConsentedMediaId(null);
                  return;
                }
                const nextPosition = Math.max(
                  lastRecordedPosition.current,
                  initialPositionSeconds
                );
                lastRecordedPosition.current = nextPosition;
                setResumePositionSeconds(nextPosition);
                setPlayerInViewport(false);
                playerReadyRef.current = false;
                initialSeekApplied.current = false;
                readinessRemainingMilliseconds.current =
                  THIRD_PARTY_MEDIA_READY_TIMEOUT_MS;
                setConsentedMediaId(media.id);
                dispatchLifecycle({ type: "load" });
              }}
            >
              {canLoad
                ? loadFailedForCurrentMedia
                  ? "Retry optional video"
                  : "Load optional video"
                : "Embedded playback unavailable"}
            </button>
          </div>
        </div>
      )}

      <div className="academy-media__details">
        <details>
          <summary>Native lesson fallback</summary>
          <p>{media.nativeSummaryFallback}</p>
          <p><strong>Offline:</strong> {media.offlineFallback}</p>
          {alternativeSource && (
            <p>
              <strong>Reviewed alternative source ({media.alternativeSourceId}):</strong>{" "}
              <a
                href={alternativeSource.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {alternativeSource.title}
              </a>
            </p>
          )}
        </details>
        {media.chapters.length > 0 && (
          <details>
            <summary>Topics covered</summary>
            <ul>{media.chapters.map((chapter) => <li key={chapter}>{chapter}</li>)}</ul>
          </details>
        )}
      </div>

      <p className="academy-media__attribution">
        {media.attribution} Licence: {media.licence}. Validated {media.lastValidated}.{" "}
        {media.originalUrl && (
          <a href={media.originalUrl} target="_blank" rel="noreferrer noopener">
            Open the original provider page
          </a>
        )}
      </p>
    </section>
  );
}
