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

function SignupForm({ idPrefix = "", showSwitchLink = true, onSuccess }) {
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
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8"
    >
      <h1 className="text-xl font-semibold text-slate-900">Sign up</h1>
      <p className="mt-1 text-sm text-slate-500">Create your TailorTrack account.</p>

      <label htmlFor={`${idPrefix}name`} className="mt-6 block text-sm font-medium text-slate-700">
        Name
      </label>
      <input
        id={`${idPrefix}name`}
        required
        value={form.name}
        onChange={update("name")}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      <label htmlFor={`${idPrefix}email`} className="mt-4 block text-sm font-medium text-slate-700">
        Email
      </label>
      <input
        id={`${idPrefix}email`}
        type="email"
        required
        value={form.email}
        onChange={update("email")}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      <label htmlFor={`${idPrefix}password`} className="mt-4 block text-sm font-medium text-slate-700">
        Password
      </label>
      <input
        id={`${idPrefix}password`}
        type="password"
        required
        value={form.password}
        onChange={update("password")}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      <div className="mt-4 flex gap-2">
        <div>
          <label htmlFor={`${idPrefix}countryCode`} className="block text-sm font-medium text-slate-700">
            Country
          </label>
          <select
            id={`${idPrefix}countryCode`}
            required
            value={form.countryCode}
            onChange={update("countryCode")}
            className="mt-1 rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.country}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor={`${idPrefix}phoneNumber`} className="block text-sm font-medium text-slate-700">
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Sign up
      </button>

      {showSwitchLink && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Log in
          </Link>
        </p>
      )}
    </form>
  );
}

export default SignupForm;
