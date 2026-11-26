import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SignupForm from "./SignupForm.jsx";
import { AuthProvider } from "../../app/AuthContext.jsx";

describe("SignupForm", () => {
  test("has first name, last name, phone, email, password and confirm password", () => {
    render(<MemoryRouter><AuthProvider><SignupForm /></AuthProvider></MemoryRouter>);
    for (const label of [/first name/i, /last name/i, /phone number/i, /^email/i, /^password/i, /confirm password/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  test("refuses to submit when the passwords differ", () => {
    render(<MemoryRouter><AuthProvider><SignupForm /></AuthProvider></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "01712345678" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "abc12345" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/do not match/i);
  });
});
