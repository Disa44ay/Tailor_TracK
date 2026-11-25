import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext.jsx";

// Mirrors backend/constants/countryCodes.js — kept in sync by hand since
// frontend and backend are separate packages with no shared import.
const COUNTRY_CODES = [
  { code: "+880", country: "Bangladesh" },
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+971", country: "UAE" },
  { code: "+966", country: "Saudi Arabia" },
];

function SignupForm({ idPrefix = "", showSwitchLink = true, onSwitchToLogin, onSuccess }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    countryCode: COUNTRY_CODES[0].code,
    phoneNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
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

      <label htmlFor={`${idPrefix}name`} className="auth-form__label">
        Name
      </label>
      <input
        id={`${idPrefix}name`}
        required
        value={form.name}
        onChange={update("name")}
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

      <div className="auth-form__row">
        <div>
          <label htmlFor={`${idPrefix}countryCode`} className="auth-form__label auth-form__label--inline">
            Country
          </label>
          <select
            id={`${idPrefix}countryCode`}
            required
            value={form.countryCode}
            onChange={update("countryCode")}
            className="auth-form__input auth-form__input--select"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.country}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor={`${idPrefix}phoneNumber`} className="auth-form__label auth-form__label--inline">
            Phone number
          </label>
          <input
            id={`${idPrefix}phoneNumber`}
            required
            pattern="\d{11}"
            maxLength={11}
            title="11-digit local number"
            value={form.phoneNumber}
            onChange={update("phoneNumber")}
            className="auth-form__input"
          />
        </div>
      </div>

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
