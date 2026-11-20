import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext.jsx";

function LoginForm({ idPrefix = "", showSwitchLink = true, onSuccess }) {
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
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8"
    >
      <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back to TailorTrack.</p>

      <label htmlFor={`${idPrefix}email`} className="mt-6 block text-sm font-medium text-slate-700">
        Email
      </label>
      <input
        id={`${idPrefix}email`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      <label htmlFor={`${idPrefix}password`} className="mt-4 block text-sm font-medium text-slate-700">
        Password
      </label>
      <input
        id={`${idPrefix}password`}
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Log in
      </button>

      {showSwitchLink && (
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/signup" className="font-medium text-slate-900 underline">
            Sign up
          </Link>
        </p>
      )}
    </form>
  );
}

export default LoginForm;
