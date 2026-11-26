# Oboyob single-page home: design

## Intent
A single-page home for the Oboyob custom clothing studio. It shows the work
in the editorial style of the Tara National Park landing page (Dribbble shot
27910241) and drives one action: book a consultation.

## Goals
- Hero: a full-bleed background photograph with a horizontal, scrollable
  foreground strip of photographs covering about two-thirds of the view,
  mirroring the Tara "Landscapes" slider.
- A showcase section for what the studio makes: Italian and double-breasted
  suits, bootcut and straight-fit trousers, formal and Cuban shirts. Each
  item has a reference photograph and a short description.
- Headlines in a condensed, high-contrast Latin serif from Google Fonts
  (Instrument Serif), used in capitals and set large, as the reference does.
- No empty bands: every section fills its space with photography, type or
  the existing kit elements.

## Non-goals
- No second page or new routes. Login and signup routes stay as they are.
- No Bengali copy. The site copy is English only.
- No new UI library. The horizontal strip uses CSS scroll-snap.
- No photographs from Shutterstock, Pinterest or Dribbble. They are style
  references only.

## Anti-goals
- A page that reads as a template, or as the Tara page copied. The layout
  borrows its rhythm; the content and imagery are the studio's own.

## Constraints
- Photographs are free Unsplash images only (licence checked per image,
  credited in the footer).
- The Bengali wordmark keeps its brand face (Anek Bangla / Tiro Bangla).
- Body text keeps the brand body face (Hind Siliguri).
- Pass sloplint --genre editorial with 0 FAIL before shipping.

## Approaches considered
1. **Latin condensed serif for English headlines (chosen).** Instrument Serif
   matches the reference's condensed display look. The Bengali wordmark keeps
   its brand face, so the two never mix in one line.
2. Keep Tiro Bangla for headlines and copy only layout and sizes. Rejected:
   Tiro Bangla is wider and does not reproduce the reference's condensed look.
3. Use a condensed sans instead of a serif. Rejected: the reference's
   character comes from its contrast, which a sans loses.

## Design
- **Hero**: background image full-bleed, one headline in Instrument Serif
  capitals (seven words or fewer), one sentence, one primary action. A
  horizontal strip of 4 to 6 photographs sits on the lower two-thirds and
  scrolls sideways with scroll-snap. Each photograph has a short label.
- **Fit statement**: unchanged in copy; the label above it is removed.
- **What we make**: a section with a large headline and a row of
  suit, trouser and shirt entries. Each entry has one photograph, a
  style name (for example "Double-breasted suit") and one line.
- **Approaches**: the dark band as it is now.
- **From cloth to fit**: the process row as it is now.
- **How it works**: the numbered list as it is now.
- **Footer**: the dark footer as it is now.

## Builder's calls (my decisions, stated for your review)
- Instrument Serif is set for English headlines only; the Bengali wordmark
  is untouched.
- The horizontal strip uses native scroll-snap, with no animation library.
- Each showcase entry gets a photograph from free Unsplash; if none fits a
  style, that entry is type-only and marked as such in the plan.

## What is left to the builder
- Exact photograph choices (search terms and final picks).
- Exact sizes and spacing, checked at 1440 and 390 widths.
