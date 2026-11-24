// Cut/ease instruction for the tailor, per garment type — a style choice,
// not a body measurement. See the design doc's "Revision note 2" for the
// research behind these lists.
// shirt/pant/panjabi lists replaced and suit/paijama added 2026-11-24 for
// the live-customization flow (see plan.md §2) — blouse/suit_2pc/suit_3pc/
// kurta keep their original lists, unaffected by that rewrite.
export const FIT_TYPES_BY_GARMENT = {
  shirt: ["italian", "casual", "party"],
  blouse: ["slim", "regular_classic", "tailored", "relaxed", "formal_office"],
  pant: ["slim", "regular", "bootcut", "baggy", "relaxed", "straightcut"],
  suit: ["double_breasted", "italian", "formal"],
  suit_2pc: ["italian_soft", "english_structured", "modern_slim", "relaxed_comfort", "double_breasted"],
  suit_3pc: ["italian_soft", "english_structured", "modern_slim", "relaxed_comfort", "double_breasted"],
  panjabi: ["regular", "short"],
  paijama: ["short", "casual"],
  kurta: ["slim_fit", "regular_fit", "loose_classic", "short_pathani", "patiala_festive"],
  // "other" has no fixed list — any value is accepted, since we don't know the garment.
  other: null,
};

export const LAPEL_STYLES = ["notch", "peak", "shawl"];
