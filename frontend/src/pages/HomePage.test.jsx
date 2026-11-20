import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage.jsx";

test("HomePage renders nav, hero, and how-it-works together", () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  expect(screen.getByText(/you imagine it\. we tailor it/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /how it works/i })).toBeInTheDocument();
});
