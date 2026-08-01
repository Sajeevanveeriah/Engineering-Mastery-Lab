import { useSyncExternalStore } from "react";

export const ACADEMY_MEDIA_PREFERENCE_KEY =
  "engineering-mastery-lab/academy-media-preference/v1";
export const ACADEMY_MEDIA_PREFERENCE_EVENT =
  "engineering-mastery-lab:academy-media-preference";

export type AcademyMediaPreference = "ask" | "allow" | "written-only";

interface ReadableStorage {
  getItem(key: string): string | null;
}

interface WritableStorage extends ReadableStorage {
  setItem(key: string, value: string): void;
}

export function readAcademyMediaPreference(
  storage: ReadableStorage
): AcademyMediaPreference {
  const value = storage.getItem(ACADEMY_MEDIA_PREFERENCE_KEY);
  return value === "allow" || value === "written-only" ? value : "ask";
}

export function writeAcademyMediaPreference(
  storage: WritableStorage,
  preference: Exclude<AcademyMediaPreference, "ask">
): void {
  storage.setItem(ACADEMY_MEDIA_PREFERENCE_KEY, preference);
}

function browserPreference(): AcademyMediaPreference {
  if (typeof window === "undefined") return "ask";
  try {
    return readAcademyMediaPreference(window.localStorage);
  } catch {
    return "ask";
  }
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ACADEMY_MEDIA_PREFERENCE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(ACADEMY_MEDIA_PREFERENCE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ACADEMY_MEDIA_PREFERENCE_EVENT, onChange);
  };
}

export function setAcademyMediaPreference(
  preference: Exclude<AcademyMediaPreference, "ask">
): boolean {
  if (typeof window === "undefined") return false;
  try {
    writeAcademyMediaPreference(window.localStorage, preference);
    window.dispatchEvent(new Event(ACADEMY_MEDIA_PREFERENCE_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function useAcademyMediaPreference(): AcademyMediaPreference {
  return useSyncExternalStore(subscribe, browserPreference, () => "ask");
}
