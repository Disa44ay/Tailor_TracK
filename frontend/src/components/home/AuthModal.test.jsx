import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../app/AuthContext.jsx";
import AuthModal from "./AuthModal.jsx";

vi.mock("../../api/client.js", () => ({
  apiFetch: vi.fn(),
}));

function renderModal(props = {}) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthModal open onClose={() => {}} {...props} />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders nothing when closed", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthModal open={false} onClose={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows both the login form and the signup form when open", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
  });

  test("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByTestId("auth-modal-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
