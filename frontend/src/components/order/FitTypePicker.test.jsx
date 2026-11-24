import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FitTypePicker from "./FitTypePicker.jsx";

describe("FitTypePicker", () => {
  test("given suit, renders exactly the three suit fit options with readable labels", () => {
    render(<FitTypePicker dressType="suit" selected={null} onSelect={() => {}} />);
    const labels = ["Double breasted", "Italian", "Formal"];
    expect(screen.getAllByRole("button")).toHaveLength(3);
    for (const label of labels) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  test("given pant, renders all six pant options and none of suit's", () => {
    render(<FitTypePicker dressType="pant" selected={null} onSelect={() => {}} />);
    const labels = ["Slim", "Regular", "Bootcut", "Baggy", "Relaxed", "Straightcut"];
    expect(screen.getAllByRole("button")).toHaveLength(6);
    for (const label of labels) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Formal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Double breasted" })).not.toBeInTheDocument();
  });

  test("calls onSelect with the wire value when an option is clicked", () => {
    const onSelect = vi.fn();
    render(<FitTypePicker dressType="suit" selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Double breasted" }));
    expect(onSelect).toHaveBeenCalledWith("double_breasted");
  });
});
