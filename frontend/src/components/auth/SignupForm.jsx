import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext.jsx";

function SignupForm({ idPrefix = "", showSwitchLink = true, onSwitchToLogin, onSuccess }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setSubmitting(true);
    try {
      await signup(form);
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
      <h1 className="auth-form__title">Sign up</h1>
      <p className="auth-form__lead">Create your Oboyob account.</p>

      <div className="auth-form__row">
        <div>
          <label htmlFor={`${idPrefix}firstName`} className="auth-form__label auth-form__label--inline">
            First name
          </label>
          <input
            id={`${idPrefix}firstName`}
            required
            value={form.firstName}
            onChange={update("firstName")}
            className="auth-form__input"
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}lastName`} className="auth-form__label auth-form__label--inline">
            Last name
          </label>
          <input
            id={`${idPrefix}lastName`}
            required
            value={form.lastName}
            onChange={update("lastName")}
            className="auth-form__input"
          />
        </div>
      </div>

      <label htmlFor={`${idPrefix}phone`} className="auth-form__label">
        Phone number
      </label>
      <input
        id={`${idPrefix}phone`}
        required
        pattern="\d{11}"
        maxLength={11}
        title="11-digit local number"
        value={form.phone}
        onChange={update("phone")}
        className="auth-form__input"
      />

      <label htmlFor={`${idPrefix}email`} className="auth-form__label">
        Email
      </label>
      <input
        id={`${idPrefix}email`}
        type="email"
        required
        value={form.email}
        onChange={update("email")}
        className="auth-form__input"
      />

      <label htmlFor={`${idPrefix}password`} className="auth-form__label">
        Password
      </label>
      <input
        id={`${idPrefix}password`}
        type="password"
        required
        value={form.password}
        onChange={update("password")}
        className="auth-form__input"
      />

      <label htmlFor={`${idPrefix}confirmPassword`} className="auth-form__label">
        Confirm password
      </label>
      <input
        id={`${idPrefix}confirmPassword`}
        type="password"
        required
        value={form.confirmPassword}
        onChange={update("confirmPassword")}
        className="auth-form__input"
      />
      {mismatch && (
        <p role="alert" className="auth-form__switch">
          Passwords do not match.
        </p>
      )}

      <button type="submit" disabled={submitting} className="auth-form__submit">
        Sign up
      </button>

      {showSwitchLink && (
        <p className="auth-form__switch">
          Already have an account?{" "}
          {onSwitchToLogin ? (
            <button type="button" onClick={onSwitchToLogin} className="auth-form__link">
              Log in
            </button>
          ) : (
            <Link to="/login" className="auth-form__link">
              Log in
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

export default SignupForm;
