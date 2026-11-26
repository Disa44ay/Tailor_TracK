import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Footer from "./Footer.jsx";

describe("Footer", () => {
  test("the Book a consultation link points up to the top of the page", () => {
    render(<Footer onBookConsultation={() => {}} />);
    expect(screen.getByRole("link", { name: /book a consultation/i })).toHaveAttribute("href", "#top");
  });

  test("the footer button opens the booking flow", () => {
    const onBook = vi.fn();
    render(<Footer onBookConsultation={onBook} />);
    fireEvent.click(screen.getByRole("button", { name: /book a consultation/i }));
    expect(onBook).toHaveBeenCalled();
  });
});
