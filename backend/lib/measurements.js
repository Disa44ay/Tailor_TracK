// Range and type checks for body measurements. Shared by the profile and enquiry
// routes. The DB CHECK constraints enforce the same ranges, but a violation there
// surfaces as a 500, so the controllers check first and return 400.
const RANGES = {
  height_cm: { min: 50, max: 250 },
  weight_kg: { min: 20, max: 300 },
  age: { min: 1, max: 120 },
};

// Returns an error message, or null when every present field is valid.
// null and undefined both mean "not provided".
export function checkMeasurements(values) {
  for (const [field, { min, max }] of Object.entries(RANGES)) {
    const value = values[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return `${field} must be a number`;
    }
    if (field === "age" && !Number.isInteger(value)) {
      return "age must be an integer";
    }
    if (value < min || value > max) {
      return `${field} must be between ${min} and ${max}`;
    }
  }
  return null;
}
