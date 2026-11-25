import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageContext } from "../../app/LanguageContext.jsx";
import Approaches from "./Approaches.jsx";

function renderApproaches() {
  return render(
    <LanguageContext.Provider value={{ lang: "en", toggleLang: () => {} }}>
      <Approaches />
    </LanguageContext.Provider>
  );
}

describe("Approaches", () => {
  test("exposes the #approaches anchor target", () => {
    const { container } = renderApproaches();
    expect(container.querySelector("#approaches")).toBeInTheDocument();
  });

  test("names both approaches", () => {
    renderApproaches();
    expect(screen.getByRole("heading", { name: /made to measure/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /bespoke/i })).toBeInTheDocument();
  });
});
