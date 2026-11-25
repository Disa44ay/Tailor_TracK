import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DressTypePicker from "./DressTypePicker.jsx";

describe("DressTypePicker", () => {
  test("renders one button per dress type with its label", () => {
    render(<DressTypePicker selected={null} onSelect={() => {}} />);
    const labels = ["Shirt", "Pant", "Panjabi", "Suit", "Paijama"];
    expect(screen.getAllByRole("button")).toHaveLength(5);
    for (const label of labels) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  test("calls onSelect with the lowercase dress type when a button is clicked", () => {
    const onSelect = vi.fn();
    render(<DressTypePicker selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Panjabi" }));
    expect(onSelect).toHaveBeenCalledWith("panjabi");
  });

  test("marks only the selected dress type as pressed", () => {
    render(<DressTypePicker selected="suit" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: "Suit" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Shirt" })).toHaveAttribute("aria-pressed", "false");
  });

  test("marks no button as pressed when nothing is selected", () => {
    render(<DressTypePicker selected={null} onSelect={() => {}} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });

  test("does not crash when onSelect is omitted", () => {
    render(<DressTypePicker selected={null} />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Shirt" }))).not.toThrow();
  });
});
