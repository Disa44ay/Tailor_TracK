import { test } from "node:test";
import assert from "node:assert/strict";
import { MEASUREMENT_FIELDS_BY_GARMENT, ALL_MEASUREMENT_FIELDS } from "../constants/measurementRelevance.js";

test("shirt now includes hem and garmentLength per the live-customization field map", () => {
  assert.ok(MEASUREMENT_FIELDS_BY_GARMENT.shirt.includes("hem"));
  assert.ok(MEASUREMENT_FIELDS_BY_GARMENT.shirt.includes("garmentLength"));
});

test("suit (the collapsed dress type) uses every measurement field", () => {
  assert.deepEqual(
    [...MEASUREMENT_FIELDS_BY_GARMENT.suit].sort(),
    [...ALL_MEASUREMENT_FIELDS].sort()
  );
});

test("paijama is defined, length-focused, and excludes the upper-body fields", () => {
  assert.ok(MEASUREMENT_FIELDS_BY_GARMENT.paijama);
  assert.ok(!MEASUREMENT_FIELDS_BY_GARMENT.paijama.includes("chest"));
  assert.ok(MEASUREMENT_FIELDS_BY_GARMENT.paijama.includes("garmentLength"));
});

test("blouse and kurta keep their original field lists, unaffected by the shirt/panjabi changes", () => {
  assert.deepEqual(MEASUREMENT_FIELDS_BY_GARMENT.blouse, [
    "neck", "chest", "shoulderWidth", "sleeveLength", "bicep", "wrist", "waist",
  ]);
  assert.deepEqual(MEASUREMENT_FIELDS_BY_GARMENT.kurta, [
    "neck", "chest", "shoulderWidth", "sleeveLength", "garmentLength",
  ]);
});
