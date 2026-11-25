import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { getBodyProfileMock, setBodyProfileMock } from "./bodyProfileMock.js";
import { MEASUREMENT_COLUMNS } from "../components/order/measurementColumns.js";

// Readable label per field key — the backend uses camelCase in PUT bodies
// but the raw column name in SELECT (see MEASUREMENT_COLUMNS), and
// backend/controllers/measurements.controller.js for that contract.
const FIELD_LABELS = {
  chest: "Chest",
  waist: "Waist",
  hip: "Hip",
  shoulderWidth: "Shoulder width",
  sleeveLength: "Sleeve length",
  inseam: "Inseam",
  neck: "Neck",
  bicep: "Bicep",
  wrist: "Wrist",
  thigh: "Thigh",
  knee: "Knee",
  rise: "Rise",
  hem: "Hem",
  garmentLength: "Garment length",
  heightCm: "Height (cm)",
  weightKg: "Weight (kg)",
  age: "Age",
};

const FIELDS = Object.entries(MEASUREMENT_COLUMNS).map(([key, column]) => [key, column, FIELD_LABELS[key]]);

const BODY_PROFILE_KEYS = ["heightCm", "weightKg", "age"];

function emptyForm() {
  return Object.fromEntries(FIELDS.map(([key]) => [key, ""]));
}

function Measurements() {
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/me/measurements")
      .then((data) => {
        const mock = getBodyProfileMock();
        setForm(
          Object.fromEntries(
            FIELDS.map(([key, column]) => {
              if (data[column] != null) return [key, data[column]];
              if (BODY_PROFILE_KEYS.includes(key) && mock[key] != null) return [key, mock[key]];
              return [key, ""];
            })
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const body = Object.fromEntries(
      FIELDS.map(([key]) => [key, form[key] === "" ? null : Number(form[key])])
    );
    try {
      await apiFetch("/me/measurements", { method: "PUT", body: JSON.stringify(body) });
      setBodyProfileMock(Object.fromEntries(BODY_PROFILE_KEYS.map((key) => [key, body[key]])));
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="p-8 text-slate-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold text-slate-900">Measurements</h1>
      <p className="mt-1 text-sm text-slate-500">
        Keep this profile up to date — every new order snapshots it.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-2 gap-4">
        {FIELDS.map(([key, , label]) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-slate-700">
              {label}
            </label>
            <input
              id={key}
              type="number"
              step="0.1"
              value={form[key]}
              onChange={update(key)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="col-span-2 mt-2 rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Save
        </button>
      </form>
    </main>
  );
}

export default Measurements;
