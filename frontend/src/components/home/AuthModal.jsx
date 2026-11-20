import { useEffect, useRef } from "react";
import LoginForm from "../auth/LoginForm.jsx";
import SignupForm from "../auth/SignupForm.jsx";

export default function AuthModal({ open, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 px-4 py-10"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Log in or sign up"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border-2 border-ink bg-paper p-6 focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 font-home-body text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
        >
          Close
        </button>

        <LoginForm idPrefix="modal-login-" showSwitchLink={false} onSuccess={onClose} />

        <p className="font-home-body text-sm text-ink">or create a new account</p>

        <SignupForm idPrefix="modal-signup-" showSwitchLink={false} onSuccess={onClose} />
      </div>
    </div>
  );
}
