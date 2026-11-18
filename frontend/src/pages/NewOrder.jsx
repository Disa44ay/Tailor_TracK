import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";

const GARMENT_TYPES = ["shirt", "pant", "panjabi", "suit_2pc", "suit_3pc", "kurta", "blouse", "other"];
const PRIORITIES = ["normal", "fast", "urgent"];

function NewOrder() {
  const navigate = useNavigate();
  const [garmentType, setGarmentType] = useState(GARMENT_TYPES[0]);
  const [styleNotes, setStyleNotes] = useState("");
  const [fabricNote, setFabricNote] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({ garmentType, styleNotes, fabricNote, priority }),
      });
      navigate("/orders");
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-xl font-semibold text-slate-900">New order</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="garmentType" className="block text-sm font-medium text-slate-700">
            Garment type
          </label>
          <select
            id="garmentType"
            value={garmentType}
            onChange={(e) => setGarmentType(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {GARMENT_TYPES.map((g) => (
              <option key={g} value={g}>
                {g.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fabricNote" className="block text-sm font-medium text-slate-700">
            Fabric note
          </label>
          <input
            id="fabricNote"
            value={fabricNote}
            onChange={(e) => setFabricNote(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="styleNotes" className="block text-sm font-medium text-slate-700">
            Style notes
          </label>
          <textarea
            id="styleNotes"
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            required={garmentType === "other"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700">Priority</legend>
          <div className="mt-1 flex gap-4">
            {PRIORITIES.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={(e) => setPriority(e.target.value)}
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Submit request
        </button>
      </form>
    </main>
  );
}

export default NewOrder;
