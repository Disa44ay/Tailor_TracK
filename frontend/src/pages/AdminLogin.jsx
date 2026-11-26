import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext.jsx";
import { adminLogin } from "../api/booking.js";

// Separate sign-in for the single studio admin account.
export default function AdminLogin() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await adminLogin(email, password);
      auth.startSession(data);
      navigate("/admin");
    } catch {
      // apiFetch already showed a toast
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1 className="auth-form__title">Studio admin</h1>
        <p className="auth-form__lead">Sign in to the consultation dashboard.</p>
        <label htmlFor="admin-email" className="auth-form__label">Email</label>
        <input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-form__input" />
        <label htmlFor="admin-password" className="auth-form__label">Password</label>
        <input id="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="auth-form__input" />
        <button type="submit" disabled={submitting} className="auth-form__submit">Log in</button>
      </form>
    </main>
  );
}
