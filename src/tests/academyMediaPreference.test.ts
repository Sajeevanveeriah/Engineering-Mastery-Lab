import { describe, expect, it } from "vitest";
import {
  ACADEMY_MEDIA_PREFERENCE_KEY,
  readAcademyMediaPreference,
  writeAcademyMediaPreference
} from "../lib/academy/mediaPreference";

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem(key: string) {
      return key === ACADEMY_MEDIA_PREFERENCE_KEY ? value : null;
    },
    setItem(key: string, next: string) {
      if (key === ACADEMY_MEDIA_PREFERENCE_KEY) value = next;
    },
    value: () => value
  };
}

describe("Academy media preference", () => {
  it("asks once when no valid preference exists", () => {
    expect(readAcademyMediaPreference(memoryStorage())).toBe("ask");
    expect(readAcademyMediaPreference(memoryStorage("unexpected"))).toBe("ask");
  });

  it.each(["allow", "written-only"] as const)(
    "round-trips the %s preference locally",
    (preference) => {
      const storage = memoryStorage();
      writeAcademyMediaPreference(storage, preference);
      expect(storage.value()).toBe(preference);
      expect(readAcademyMediaPreference(storage)).toBe(preference);
    }
  );
});
