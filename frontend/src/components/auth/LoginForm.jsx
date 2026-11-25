import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext.jsx";

function LoginForm({ idPrefix = "", showSwitchLink = true, onSwitchToSignup, onSuccess }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
      navigate("/");
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-form__title">Log in</h1>
      <p className="auth-form__lead">Welcome back to Oboyob.</p>

      <label htmlFor={`${idPrefix}email`} className="auth-form__label">
        Email
      </label>
      <input
        id={`${idPrefix}email`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="auth-form__input"
      />

      <label htmlFor={`${idPrefix}password`} className="auth-form__label">
        Password
      </label>
      <input
        id={`${idPrefix}password`}
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="auth-form__input"
      />

      <button type="submit" disabled={submitting} className="auth-form__submit">
        Log in
      </button>

      {showSwitchLink && (
        <p className="auth-form__switch">
          New here?{" "}
          {onSwitchToSignup ? (
            <button type="button" onClick={onSwitchToSignup} className="auth-form__link">
              Sign up
            </button>
          ) : (
            <Link to="/signup" className="auth-form__link">
              Sign up
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

export default LoginForm;
