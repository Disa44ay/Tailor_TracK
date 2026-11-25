import { describe, test, expect } from "vitest";
import { FIT_OPTIONS_BY_GARMENT } from "./fitOptionsByGarment.js";

describe("FIT_OPTIONS_BY_GARMENT", () => {
  test("has exactly the five dress types from plan.md", () => {
    expect(Object.keys(FIT_OPTIONS_BY_GARMENT).sort()).toEqual(
      ["paijama", "panjabi", "pant", "shirt", "suit"]
    );
  });

  test("suit options match plan.md section 2", () => {
    expect(FIT_OPTIONS_BY_GARMENT.suit).toEqual(["double_breasted", "italian", "formal"]);
  });

  test("pant has all six researched options", () => {
    expect(FIT_OPTIONS_BY_GARMENT.pant).toEqual(
      ["slim", "regular", "bootcut", "baggy", "relaxed", "straightcut"]
    );
  });
});
