import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import Home from "./Home.jsx";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Home />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders the public homepage", () => {
    renderHome();
    expect(screen.getAllByText(/log in/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/you imagine it\. we tailor it/i)).toBeInTheDocument();
  });
});
