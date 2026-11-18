// Short, deliberately non-exhaustive list matching the shop's likely
// customer base, not a full ISO country-code table — add more as needed.
export const COUNTRY_CODES = [
  { code: "+880", country: "Bangladesh" },
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+971", country: "UAE" },
  { code: "+966", country: "Saudi Arabia" },
];

export const COUNTRY_CODE_VALUES = COUNTRY_CODES.map((c) => c.code);
