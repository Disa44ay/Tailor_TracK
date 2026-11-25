import { describe, test, expect } from "vitest";
import { MEASUREMENT_FIELDS_BY_GARMENT } from "./measurementFieldsByGarment.js";

const KNOWN_FIELDS = [
  "chest", "waist", "hip", "shoulderWidth", "sleeveLength", "inseam", "neck",
  "bicep", "wrist", "thigh", "knee", "rise", "hem", "garmentLength",
];

describe("MEASUREMENT_FIELDS_BY_GARMENT", () => {
  test("shirt excludes lower-body fields", () => {
    expect(MEASUREMENT_FIELDS_BY_GARMENT.shirt).not.toContain("thigh");
    expect(MEASUREMENT_FIELDS_BY_GARMENT.shirt).not.toContain("knee");
    expect(MEASUREMENT_FIELDS_BY_GARMENT.shirt).toContain("chest");
  });

  test("pant excludes upper-body-only fields", () => {
    expect(MEASUREMENT_FIELDS_BY_GARMENT.pant).not.toContain("neck");
    expect(MEASUREMENT_FIELDS_BY_GARMENT.pant).not.toContain("chest");
    expect(MEASUREMENT_FIELDS_BY_GARMENT.pant).toContain("thigh");
  });

  test("every dress type's fields are a subset of the 14 known measurement keys", () => {
    for (const fields of Object.values(MEASUREMENT_FIELDS_BY_GARMENT)) {
      for (const f of fields) expect(KNOWN_FIELDS).toContain(f);
    }
  });
});
