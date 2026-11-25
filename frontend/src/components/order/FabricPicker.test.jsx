import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FabricPicker from "./FabricPicker.jsx";

const FABRICS = [
  {
    id: 1,
    name: "Oxford Blue",
    color_hex: "#2F4C86",
    print_pattern: "striped",
    texture: "cotton",
    swatch_image_url: null,
    price_modifier: 250,
  },
  {
    id: 2,
    name: "Ivory Silk",
    color_hex: "#F2EADF",
    print_pattern: "solid",
    texture: "silk",
    swatch_image_url: "https://example.test/ivory-silk.jpg",
    price_modifier: 0,
  },
];

describe("FabricPicker", () => {
  test("shows a loading skeleton while loading", () => {
    render(<FabricPicker fabrics={[]} loading onSelect={() => {}} />);
    expect(screen.getAllByTestId("fabric-skeleton-card").length).toBeGreaterThan(0);
  });

  test("shows an empty state when there are no fabrics", () => {
    render(<FabricPicker fabrics={[]} loading={false} onSelect={() => {}} />);
    expect(screen.getByText(/no fabrics/i)).toBeInTheDocument();
  });

  test("shows an error state", () => {
    render(<FabricPicker fabrics={[]} error="Could not load fabrics" onSelect={() => {}} />);
    expect(screen.getByText(/could not load fabrics/i)).toBeInTheDocument();
  });

  test("renders a card per fabric with name and pattern/texture, no price shown", () => {
    render(<FabricPicker fabrics={FABRICS} onSelect={() => {}} />);
    expect(screen.getByText("Oxford Blue")).toBeInTheDocument();
    expect(screen.getByText(/striped, cotton/i)).toBeInTheDocument();
    expect(screen.queryByText(/250/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });

  test("renders the real swatch image when swatch_image_url is set, else a colour fill", () => {
    render(<FabricPicker fabrics={FABRICS} onSelect={() => {}} />);
    const img = screen.getByRole("img", { name: "Ivory Silk" });
    expect(img).toHaveAttribute("src", "https://example.test/ivory-silk.jpg");

    const fallbackCard = screen.getByRole("button", { name: /oxford blue/i });
    expect(fallbackCard.querySelector('[data-testid="fabric-fill"]')).toHaveStyle({
      backgroundColor: "#2F4C86",
    });
  });

  test("calls onSelect with the fabric id when a card is clicked", () => {
    const onSelect = vi.fn();
    render(<FabricPicker fabrics={FABRICS} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /oxford blue/i }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test("marks the selected card as pressed", () => {
    render(<FabricPicker fabrics={FABRICS} selectedId={2} onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /oxford blue/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /ivory silk/i })).toHaveAttribute("aria-pressed", "true");
  });

  test("does not crash when fabrics is undefined (data not fetched yet)", () => {
    render(<FabricPicker fabrics={undefined} onSelect={() => {}} />);
    expect(screen.getByText(/no fabrics/i)).toBeInTheDocument();
  });

  test("does not crash when onSelect is omitted", () => {
    render(<FabricPicker fabrics={FABRICS} />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: /oxford blue/i }))).not.toThrow();
  });

  test("falls back to the colour fill when the swatch image fails to load", () => {
    render(<FabricPicker fabrics={FABRICS} onSelect={() => {}} />);
    const img = screen.getByRole("img", { name: "Ivory Silk" });
    fireEvent.error(img);
    const card = screen.getByRole("button", { name: /ivory silk/i });
    expect(card.querySelector('[data-testid="fabric-fill"]')).toHaveStyle({
      backgroundColor: "#F2EADF",
    });
    expect(card.querySelector("img")).not.toBeInTheDocument();
  });
});
