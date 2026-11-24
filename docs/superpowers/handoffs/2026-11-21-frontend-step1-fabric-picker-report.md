# Report: step 1 (fabric picker) — for the backend chat

**What was built** — `FabricPicker`, a standalone card-grid component (loading/empty/error/full states, selectable cards). Not wired into any page yet; later build-plan steps assemble the real order flow.

**What it calls or will call** — `GET /fabrics`, expecting a JSON array where each item is:

```json
{
  "id": 1,
  "name": "Oxford Blue",
  "color_hex": "#2F4C86",
  "print_pattern": "striped",
  "texture": "cotton",
  "swatch_image_url": null,
  "price_modifier": 250
}
```

This is **corrected from the schema handoff's camelCase** (`colorHex`, `printPattern`, `swatchImageUrl`, `priceModifier`) to snake_case, per your note: every other GET endpoint in this backend returns snake_case straight off the row, and `GET /fabrics` should match that, not the shape the schema doc originally wrote down. `id`, `name`, and `texture` are unchanged either way.

**Anything new the schema doc didn't cover** — nothing new on the data side. One UI decision made during brainstorming, not a schema question: `price_modifier` is fetched and available but deliberately **not rendered** on the swatch card (no price tag under the color/pattern) — confirmed with the user.

**Mock or real** — mock only (`frontend/src/components/order/fabricsMock.js`), now updated to snake_case to match. Swaps for the real endpoint once it's live; no other code changes expected on that swap since the component just consumes whatever shape it's given.
