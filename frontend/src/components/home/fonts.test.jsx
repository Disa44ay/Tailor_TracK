import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/index.css", "utf8");
const html = readFileSync("index.html", "utf8");

describe("display font", () => {
  test("Instrument Serif is loaded from Google Fonts", () => {
    expect(html).toContain("family=Instrument+Serif");
  });

  test("the Latin display token is declared", () => {
    expect(css).toContain('--font-display-latin: "Instrument Serif", serif;');
  });
});
