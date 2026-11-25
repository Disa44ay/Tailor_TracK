// camelCase measurement field key -> snake_case DB column. Shared by
// Measurements.jsx (full profile form) and NewOrder.jsx (live order flow),
// since both read/write GET & PUT /me/measurements against the same columns.
export const MEASUREMENT_COLUMNS = {
  chest: "chest",
  waist: "waist",
  hip: "hip",
  shoulderWidth: "shoulder_width",
  sleeveLength: "sleeve_length",
  inseam: "inseam",
  neck: "neck",
  bicep: "bicep",
  wrist: "wrist",
  thigh: "thigh",
  knee: "knee",
  rise: "rise",
  hem: "hem",
  garmentLength: "garment_length",
  heightCm: "height_cm",
  weightKg: "weight_kg",
  age: "age",
};
