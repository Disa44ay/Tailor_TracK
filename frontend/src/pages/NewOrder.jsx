import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import FabricPicker from "../components/order/FabricPicker.jsx";
import fabricsMock from "../components/order/fabricsMock.js";
import ShirtSketch from "../components/order/sketch/ShirtSketch.jsx";

const GARMENT_TYPES = ["shirt", "pant", "panjabi", "suit_2pc", "suit_3pc", "kurta", "blouse", "other"];
const PRIORITIES = ["normal", "fast", "urgent"];

function NewOrder() {
  const navigate = useNavigate();
  const [garmentType, setGarmentType] = useState(GARMENT_TYPES[0]);
  const [styleNotes, setStyleNotes] = useState("");
  const [fabricNote, setFabricNote] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [fabricId, setFabricId] = useState(null);
  // Standalone preview control for now — not yet driven by the customer's
  // real measurement sliders (that wiring is a separate build-plan step).
  const [fitValue, setFitValue] = useState(0.5);

  const selectedFabric = fabricsMock.find((f) => f.id === fabricId) ?? null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          garmentType,
          styleNotes,
          fabricNote,
          priority,
          ...(fabricId != null ? { fabricId } : {}),
        }),
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

      <section className="mt-6 space-y-4">
        <ShirtSketch
          fitValue={fitValue}
          colorHex={selectedFabric?.color_hex ?? "#D6D6D2"}
          texture={selectedFabric?.texture ?? "cotton"}
          printPattern={selectedFabric?.print_pattern ?? "solid"}
        />

        <label className="block text-sm font-medium text-slate-700">
          Fit preview: slim – relaxed
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={fitValue}
            onChange={(e) => setFitValue(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <FabricPicker fabrics={fabricsMock} selectedId={fabricId} onSelect={setFabricId} />
      </section>

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
