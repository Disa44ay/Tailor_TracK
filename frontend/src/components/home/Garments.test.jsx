import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageContext } from "../../app/LanguageContext.jsx";
import Garments from "./Garments.jsx";

describe("Garments", () => {
  test("lists the four garment categories", () => {
    render(
      <LanguageContext.Provider value={{ lang: "en", toggleLang: () => {} }}>
        <Garments />
      </LanguageContext.Provider>
    );
    ["Suit", "Panjabi", "Shirt", "Trousers"].forEach((name) =>
      expect(screen.getByRole("heading", { name })).toBeInTheDocument()
    );
  });
});
