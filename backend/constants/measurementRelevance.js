// Which of the 14 measurement fields a garment's order form should show.
// Display-only — never used to filter or zero what's actually stored.
export const ALL_MEASUREMENT_FIELDS = [
  "chest", "waist", "hip", "shoulderWidth", "sleeveLength", "inseam", "neck",
  "bicep", "wrist", "thigh", "knee", "rise", "hem", "garmentLength",
];

const SHIRT_FIELDS = ["neck", "chest", "shoulderWidth", "sleeveLength", "bicep", "wrist", "waist"];
const PANT_FIELDS = ["waist", "hip", "inseam", "thigh", "knee", "rise", "hem"];
const SUIT_FIELDS = [
  "neck", "chest", "shoulderWidth", "sleeveLength", "bicep", "waist",
  "garmentLength", "hip", "inseam", "thigh", "knee", "rise", "hem",
];
const PANJABI_FIELDS = ["neck", "chest", "shoulderWidth", "sleeveLength", "garmentLength"];

export const MEASUREMENT_FIELDS_BY_GARMENT = {
  shirt: SHIRT_FIELDS,
  blouse: SHIRT_FIELDS,
  pant: PANT_FIELDS,
  suit_2pc: SUIT_FIELDS,
  suit_3pc: SUIT_FIELDS,
  panjabi: PANJABI_FIELDS,
  kurta: PANJABI_FIELDS,
  other: ALL_MEASUREMENT_FIELDS,
};
