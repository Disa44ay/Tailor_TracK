import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import FabricPicker from "../components/order/FabricPicker.jsx";
import fabricsMock from "../components/order/fabricsMock.js";
import DressTypePicker from "../components/order/DressTypePicker.jsx";
import FitTypePicker from "../components/order/FitTypePicker.jsx";
import MeasurementSliderPanel from "../components/order/MeasurementSliderPanel.jsx";
import { MEASUREMENT_FIELDS_BY_GARMENT } from "../components/order/measurementFieldsByGarment.js";
import GarmentSketch from "../components/order/sketch/GarmentSketch.jsx";
import { exportSketchPng } from "../components/order/sketch/exportSketchPng.js";
import { getBodyProfileMock, setBodyProfileMock } from "./bodyProfileMock.js";

const PRIORITIES = ["normal", "fast", "urgent"];
const BODY_PROFILE_FIELDS = ["heightCm", "weightKg", "age"];

// camelCase measurement field -> snake_case DB column, same mapping
// Measurements.jsx's FIELDS array uses, needed to read GET /me/measurements.
const MEASUREMENT_COLUMNS = {
  chest: "chest",
  waist: "waist",
  hip: "hip",
  shoulderWidth: "shoulder_width",
  sleeveLength: "sleeve_length",
  inseam: "inseam",
  neck: "neck",
  bicep: "bicep",
  wrist: "wrist",
  thigh: "thigh",
  knee: "knee",
  rise: "rise",
  hem: "hem",
  garmentLength: "garment_length",
  heightCm: "height_cm",
  weightKg: "weight_kg",
  age: "age",
};

function emptyValues() {
  return Object.fromEntries(Object.keys(MEASUREMENT_COLUMNS).map((key) => [key, ""]));
}

// The body-profile fields (height/weight/age) always go in every PUT
// alongside whichever garment fields the current dressType shows — they
// feed the backend's measurement estimates (plan.md §3) regardless of
// what's being ordered right now, same as Measurements.jsx's own PUT.
function measurementsBody(dressType, values) {
  const fields = [...(MEASUREMENT_FIELDS_BY_GARMENT[dressType] ?? []), ...BODY_PROFILE_FIELDS];
  return Object.fromEntries(
    fields.map((field) => [field, values[field] === "" || values[field] == null ? null : Number(values[field])])
  );
}

function NewOrder() {
  const navigate = useNavigate();
  const [dressType, setDressType] = useState("shirt");
  const [fitType, setFitType] = useState(null);
  const [styleNotes, setStyleNotes] = useState("");
  const [fabricNote, setFabricNote] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [fabricId, setFabricId] = useState(null);
  // Standalone preview control for now — not yet driven by the customer's
  // real measurement sliders (that wiring is a separate build-plan step).
  const [fitValue, setFitValue] = useState(0.5);
  const [values, setValues] = useState(emptyValues());
  const [estimated, setEstimated] = useState(null);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const sketchRef = useRef(null);

  useEffect(() => {
    apiFetch("/me/measurements")
      .then((data) => {
        const mock = getBodyProfileMock();
        setValues((prev) =>
          Object.fromEntries(
            Object.entries(MEASUREMENT_COLUMNS).map(([key, column]) => {
              if (data?.[column] != null) return [key, data[column]];
              if (BODY_PROFILE_FIELDS.includes(key) && mock[key] != null) return [key, mock[key]];
              return [key, prev[key]];
            })
          )
        );
        setEstimated(data?.estimated ?? null);
      })
      .catch(() => {});
  }, []);

  const selectedFabric = fabricsMock.find((f) => f.id === fabricId) ?? null;

  function handleDressTypeSelect(value) {
    setDressType(value);
    // A fit from the previous garment's option set would be stale/invalid
    // for the new one (Review Focus item 2) — clear it on every switch.
    setFitType(null);
  }

  function handleMeasurementChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  // Persists whatever the customer typed, saved or not — createOrder reads
  // its measurements_snapshot straight from the DB, not from the order
  // request body, so an unsaved edit would otherwise be silently dropped
  // from the order it was meant for.
  async function saveMeasurements() {
    const body = measurementsBody(dressType, values);
    await apiFetch("/me/measurements", { method: "PUT", body: JSON.stringify(body) });
    setBodyProfileMock(Object.fromEntries(BODY_PROFILE_FIELDS.map((key) => [key, body[key]])));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveMeasurements();
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          garmentType: dressType,
          styleNotes,
          fabricNote,
          priority,
          ...(fitType != null ? { fitType } : {}),
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

  async function handleSaveMeasurements() {
    setSavingMeasurements(true);
    try {
      await saveMeasurements();
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setSavingMeasurements(false);
    }
  }

  async function handleSavePng() {
    if (!sketchRef.current) return;
    const fields = MEASUREMENT_FIELDS_BY_GARMENT[dressType] ?? [];
    const measurementsForExport = Object.fromEntries(fields.map((field) => [field, values[field]]));
    try {
      await exportSketchPng(sketchRef.current, measurementsForExport);
    } catch {
      // Best-effort client-side export; nothing else depends on its result.
    }
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-xl font-semibold text-slate-900">New order</h1>

      <section className="mt-6 space-y-4">
        <DressTypePicker selected={dressType} onSelect={handleDressTypeSelect} />

        <FabricPicker fabrics={fabricsMock} selectedId={fabricId} onSelect={setFabricId} />

        <FitTypePicker dressType={dressType} selected={fitType} onSelect={setFitType} />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="heightCm" className="block text-sm font-medium text-slate-700">
              Height (cm)
            </label>
            <input
              id="heightCm"
              type="number"
              step="0.1"
              value={values.heightCm}
              onChange={(e) => handleMeasurementChange("heightCm", e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="weightKg" className="block text-sm font-medium text-slate-700">
              Weight (kg)
            </label>
            <input
              id="weightKg"
              type="number"
              step="0.1"
              value={values.weightKg}
              onChange={(e) => handleMeasurementChange("weightKg", e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-700">
              Age
            </label>
            <input
              id="age"
              type="number"
              step="1"
              value={values.age}
              onChange={(e) => handleMeasurementChange("age", e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div ref={sketchRef}>
          <GarmentSketch
            dressType={dressType}
            fitValue={fitValue}
            fitType={fitType ?? undefined}
            colorHex={selectedFabric?.color_hex ?? "#D6D6D2"}
            texture={selectedFabric?.texture ?? "cotton"}
            printPattern={selectedFabric?.print_pattern ?? "solid"}
          />
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Fit preview: slim to relaxed
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

        <MeasurementSliderPanel
          dressType={dressType}
          values={values}
          estimated={estimated}
          onChange={handleMeasurementChange}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveMeasurements}
            disabled={savingMeasurements}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            Save measurements
          </button>
          <button
            type="button"
            onClick={handleSavePng}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
          >
            Save design as PNG
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
