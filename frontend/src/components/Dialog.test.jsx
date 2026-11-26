import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dialog from "./Dialog.jsx";

describe("Dialog", () => {
  test("renders nothing when closed", () => {
    render(<Dialog open={false} onClose={() => {}} label="Test"><p>body</p></Dialog>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("closes from the Close button, the backdrop and the Escape key", () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} label="Test"><p>body</p></Dialog>);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("dialog").parentElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  test("a click inside the dialog does not close it", () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} label="Test"><p>body</p></Dialog>);
    fireEvent.click(screen.getByText("body"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
