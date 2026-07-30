import { useEffect, useRef, useState } from "react";

type EngineeringSceneProps = {
  mastery: number;
  stage: string;
  milestone: string;
  release: string;
};

const assetPath = (filename: string) => `./assets/${filename}`;

const assets = {
  studio: {
    desktop: {
      png: assetPath("20260730-Engineering-Mastery-Lab-Hero-Studio-Desktop-Rev00.png"),
      webp: assetPath("20260730-Engineering-Mastery-Lab-Hero-Studio-Desktop-Rev00.webp")
    },
    tablet: {
      png: assetPath("20260730-Engineering-Mastery-Lab-Hero-Studio-Tablet-Rev00.png"),
      webp: assetPath("20260730-Engineering-Mastery-Lab-Hero-Studio-Tablet-Rev00.webp")
    },
    mobile: {
      png: assetPath("20260730-Engineering-Mastery-Lab-Hero-Studio-Mobile-Rev00.png"),
      webp: assetPath("20260730-Engineering-Mastery-Lab-Hero-Studio-Mobile-Rev00.webp")
    }
  },
  rover: {
    png: assetPath("20260730-Engineering-Mastery-Lab-Hero-Rover-Rev00.png"),
    webp: assetPath("20260730-Engineering-Mastery-Lab-Hero-Rover-Rev00.webp")
  },
  equipment: {
    png: assetPath("20260730-Engineering-Mastery-Lab-Hero-Equipment-Rev00.png"),
    webp: assetPath("20260730-Engineering-Mastery-Lab-Hero-Equipment-Rev00.webp")
  }
} as const;

export function EngineeringScene({
  mastery,
  stage,
  milestone,
  release
}: EngineeringSceneProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px 0px", threshold: 0.12 }
    );
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const active = inView && documentVisible;

  return (
    <figure
      ref={sceneRef}
      className="engineering-scene"
      data-scene-active={active ? "true" : "false"}
      aria-labelledby="engineering-scene-caption"
    >
      <picture className="engineering-scene__studio">
        <source media="(max-width: 700px)" type="image/webp" srcSet={assets.studio.mobile.webp} />
        <source media="(max-width: 700px)" srcSet={assets.studio.mobile.png} />
        <source media="(max-width: 1100px)" type="image/webp" srcSet={assets.studio.tablet.webp} />
        <source media="(max-width: 1100px)" srcSet={assets.studio.tablet.png} />
        <source type="image/webp" srcSet={assets.studio.desktop.webp} />
        <img
          src={assets.studio.desktop.png}
          width="1280"
          height="853"
          alt="Three engineers collaborate around a wheeled mobile robot in an electronics laboratory with test equipment and mechanical components."
          decoding="async"
          fetchPriority="high"
        />
      </picture>

      <picture className="engineering-scene__object engineering-scene__object--rover" aria-hidden="true">
        <source type="image/webp" srcSet={assets.rover.webp} />
        <img src={assets.rover.png} width="512" height="512" alt="" decoding="async" />
      </picture>

      <picture className="engineering-scene__object engineering-scene__object--equipment" aria-hidden="true">
        <source type="image/webp" srcSet={assets.equipment.webp} />
        <img src={assets.equipment.png} width="512" height="512" alt="" decoding="async" />
      </picture>

      <div className="engineering-scene__metric">
        <span>Mastery gates</span>
        <strong>{mastery}%</strong>
        <small>passed in the local record</small>
      </div>

      <dl className="engineering-scene__signals">
        <div><dt>Stage</dt><dd>{stage}</dd></div>
        <div><dt>Milestone</dt><dd>{milestone}</dd></div>
        <div><dt>Release</dt><dd>{release}</dd></div>
      </dl>

      <figcaption id="engineering-scene-caption" className="sr-only">
        Engineering studio scene with live local progress: {mastery}% of mastery gates passed,
        current stage {stage}, milestone {milestone}, and rover release {release}.
      </figcaption>
    </figure>
  );
}
