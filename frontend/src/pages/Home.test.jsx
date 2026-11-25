import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../app/AuthContext.jsx";
import { LanguageProvider } from "../app/LanguageContext.jsx";
import Home from "./Home.jsx";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LanguageProvider>
        <AuthProvider>
          <Home />
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders the public homepage in Bangla by default", () => {
    renderHome();
    expect(screen.getAllByText(/লগ ইন/).length).toBeGreaterThan(0);
    expect(screen.getByText(/সঠিক ফিট চান এমন পুরুষদের জন্য কাস্টম টেইলারিং/)).toBeInTheDocument();
  });
});
