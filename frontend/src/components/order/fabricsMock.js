// Stand-in for GET /fabrics until backend ships it (see
// docs/superpowers/handoffs/2026-11-21-order-customization-schema.md).
// Shape matches this backend's convention: snake_case straight off the row,
// like every other GET endpoint (height_cm, garment_type, etc) — not the
// camelCase first written in the schema handoff, corrected 2026-11-21.
const fabricsMock = [
  { id: 1, name: "Oxford Blue", color_hex: "#2F4C86", print_pattern: "striped", texture: "cotton", swatch_image_url: null, price_modifier: 250 },
  { id: 2, name: "Ivory Silk", color_hex: "#F2EADF", print_pattern: "solid", texture: "silk", swatch_image_url: null, price_modifier: 600 },
  { id: 3, name: "Charcoal Wool", color_hex: "#3A3A3C", print_pattern: "solid", texture: "wool", swatch_image_url: null, price_modifier: 450 },
  { id: 4, name: "Sandstone Linen", color_hex: "#C9B79C", print_pattern: "checked", texture: "linen", swatch_image_url: null, price_modifier: 180 },
  { id: 5, name: "Indigo Denim", color_hex: "#2E4057", print_pattern: "solid", texture: "denim", swatch_image_url: null, price_modifier: 0 },
  { id: 6, name: "Pearl Grey Cotton", color_hex: "#D6D6D2", print_pattern: "checked", texture: "cotton", swatch_image_url: null, price_modifier: 0 },
  { id: 7, name: "Burgundy Wool", color_hex: "#6B2737", print_pattern: "solid", texture: "wool", swatch_image_url: null, price_modifier: 480 },
  { id: 8, name: "Forest Check", color_hex: "#2F4A3C", print_pattern: "checked", texture: "cotton", swatch_image_url: null, price_modifier: 220 },
  { id: 9, name: "Champagne Silk", color_hex: "#E4CDA0", print_pattern: "solid", texture: "silk", swatch_image_url: null, price_modifier: 620 },
  { id: 10, name: "Slate Stripe", color_hex: "#51596B", print_pattern: "striped", texture: "cotton", swatch_image_url: null, price_modifier: 230 },
  { id: 11, name: "Terracotta Linen", color_hex: "#B5603F", print_pattern: "solid", texture: "linen", swatch_image_url: null, price_modifier: 190 },
  { id: 12, name: "Midnight Denim", color_hex: "#1C2531", print_pattern: "solid", texture: "denim", swatch_image_url: null, price_modifier: 10 },
  { id: 13, name: "Mustard Check", color_hex: "#C79A3A", print_pattern: "checked", texture: "cotton", swatch_image_url: null, price_modifier: 200 },
  { id: 14, name: "Dusty Rose Wool", color_hex: "#A9727E", print_pattern: "solid", texture: "wool", swatch_image_url: null, price_modifier: 470 },
];

export default fabricsMock;
