import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Garments from "./Garments.jsx";

describe("Garments", () => {
  test("lists the four garment categories", () => {
    render(<Garments />);
    ["Suit", "Panjabi", "Shirt", "Trousers"].forEach((name) =>
      expect(screen.getByRole("heading", { name })).toBeInTheDocument()
    );
  });
});
