import { describe, expect, it } from "vitest";
import { resolveSliderDraft } from "../components/Slider";

describe("precise slider draft resolution", () => {
  it("cancels an Escape draft without notifying the parent", () => {
    expect(resolveSliderDraft("91", 25, 0, 100, true)).toEqual({
      draft: "25",
      value: 25,
      notifyChange: false
    });
  });

  it("commits and clamps a valid draft on a normal blur", () => {
    expect(resolveSliderDraft("120", 25, 0, 100, false)).toEqual({
      draft: "100",
      value: 100,
      notifyChange: true
    });
  });
});
