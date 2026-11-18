// Cut/ease instruction for the tailor, per garment type — a style choice,
// not a body measurement. See the design doc's "Revision note 2" for the
// research behind these lists.
export const FIT_TYPES_BY_GARMENT = {
  shirt: ["slim", "regular_classic", "tailored", "relaxed", "formal_office"],
  blouse: ["slim", "regular_classic", "tailored", "relaxed", "formal_office"],
  pant: ["slim", "straight", "bootcut", "relaxed", "office_formal"],
  suit_2pc: ["italian_soft", "english_structured", "modern_slim", "relaxed_comfort", "double_breasted"],
  suit_3pc: ["italian_soft", "english_structured", "modern_slim", "relaxed_comfort", "double_breasted"],
  panjabi: ["slim_fit", "regular_fit", "loose_classic", "short_pathani", "patiala_festive"],
  kurta: ["slim_fit", "regular_fit", "loose_classic", "short_pathani", "patiala_festive"],
  // "other" has no fixed list — any value is accepted, since we don't know the garment.
  other: null,
};

export const LAPEL_STYLES = ["notch", "peak", "shawl"];
