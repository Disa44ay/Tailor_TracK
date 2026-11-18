import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";

// camelCase request keys <-> snake_case columns the GET response returns —
// the backend uses camelCase in PUT bodies but the raw column name in SELECT,
// see backend/controllers/measurements.controller.js.
const FIELDS = [
  ["chest", "chest", "Chest"],
  ["waist", "waist", "Waist"],
  ["hip", "hip", "Hip"],
  ["shoulderWidth", "shoulder_width", "Shoulder width"],
  ["sleeveLength", "sleeve_length", "Sleeve length"],
  ["inseam", "inseam", "Inseam"],
  ["neck", "neck", "Neck"],
  ["bicep", "bicep", "Bicep"],
  ["wrist", "wrist", "Wrist"],
  ["thigh", "thigh", "Thigh"],
  ["knee", "knee", "Knee"],
  ["rise", "rise", "Rise"],
  ["hem", "hem", "Hem"],
  ["garmentLength", "garment_length", "Garment length"],
];

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
        setForm(
          Object.fromEntries(
            FIELDS.map(([key, column]) => [key, data[column] ?? ""])
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
