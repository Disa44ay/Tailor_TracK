// Which of the 14 measurement fields apply per dress type, from plan.md section 4.
// Keys match Measurements.jsx's FIELDS keys (camelCase).
export const MEASUREMENT_FIELDS_BY_GARMENT = {
  shirt: ["chest", "waist", "shoulderWidth", "sleeveLength", "neck", "bicep", "wrist", "hem", "garmentLength"],
  pant: ["waist", "hip", "inseam", "thigh", "knee", "rise", "hem"],
  panjabi: ["chest", "waist", "hip", "shoulderWidth", "sleeveLength", "neck", "hem", "garmentLength"],
  suit: ["chest", "waist", "hip", "shoulderWidth", "sleeveLength", "inseam", "neck", "bicep", "wrist", "thigh", "knee", "rise", "hem", "garmentLength"],
  paijama: ["waist", "hip", "inseam", "thigh", "knee", "rise", "hem", "garmentLength"],
};
