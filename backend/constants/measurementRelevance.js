// Which of the 14 measurement fields a garment's order form should show.
// Display-only — never used to filter or zero what's actually stored.
export const ALL_MEASUREMENT_FIELDS = [
  "chest", "waist", "hip", "shoulderWidth", "sleeveLength", "inseam", "neck",
  "bicep", "wrist", "thigh", "knee", "rise", "hem", "garmentLength",
];

// Original lists, kept for blouse/suit_2pc/suit_3pc/kurta — the plain
// (non-customized) order form's garment types, unaffected by the
// 2026-11-24 live-customization rewrite below (plan.md §4).
const BLOUSE_FIELDS = ["neck", "chest", "shoulderWidth", "sleeveLength", "bicep", "wrist", "waist"];
const SUIT_2PC_3PC_FIELDS = [
  "neck", "chest", "shoulderWidth", "sleeveLength", "bicep", "waist",
  "garmentLength", "hip", "inseam", "thigh", "knee", "rise", "hem",
];
const KURTA_FIELDS = ["neck", "chest", "shoulderWidth", "sleeveLength", "garmentLength"];

// shirt/panjabi replaced, pant unchanged (already matched), suit/paijama
// added 2026-11-24 for the live-customization flow's 5 dress types — see
// plan.md §4, flagged there as a first pass needing a real tailoring-
// knowledge check, not independently verified here.
const SHIRT_FIELDS = [
  "chest", "waist", "shoulderWidth", "sleeveLength", "neck", "bicep", "wrist", "hem", "garmentLength",
];
const PANT_FIELDS = ["waist", "hip", "inseam", "thigh", "knee", "rise", "hem"];
const PANJABI_FIELDS = ["chest", "waist", "hip", "shoulderWidth", "sleeveLength", "neck", "hem", "garmentLength"];
const PAIJAMA_FIELDS = ["waist", "hip", "inseam", "thigh", "knee", "rise", "hem", "garmentLength"];

export const MEASUREMENT_FIELDS_BY_GARMENT = {
  shirt: SHIRT_FIELDS,
  blouse: BLOUSE_FIELDS,
  pant: PANT_FIELDS,
  suit: ALL_MEASUREMENT_FIELDS,
  suit_2pc: SUIT_2PC_3PC_FIELDS,
  suit_3pc: SUIT_2PC_3PC_FIELDS,
  panjabi: PANJABI_FIELDS,
  paijama: PAIJAMA_FIELDS,
  kurta: KURTA_FIELDS,
  other: ALL_MEASUREMENT_FIELDS,
};
