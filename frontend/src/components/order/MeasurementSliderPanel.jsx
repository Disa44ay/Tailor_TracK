import { useState } from "react";
import { MEASUREMENT_FIELDS_BY_GARMENT } from "./measurementFieldsByGarment.js";

// camelCase field key -> readable label, e.g. "shoulderWidth" -> "Shoulder width".
function formatFieldLabel(field) {
  const spaced = field.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

// plan.md §3: a field with no stored value previews the backend's estimate
// and discloses that it's a guess, until the user actually adjusts it.
function MeasurementSliderPanel({ dressType, values, estimated, onChange }) {
  const fields = MEASUREMENT_FIELDS_BY_GARMENT[dressType] ?? [];
  const [touched, setTouched] = useState(() => new Set());

  function handleChange(field) {
    return (e) => {
      setTouched((prev) => new Set(prev).add(field));
      const raw = e.target.value;
      onChange?.(field, raw === "" ? "" : Number(raw));
    };
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((field) => {
        const hasStoredValue = values[field] !== "" && values[field] != null;
        const estimateValue = estimated?.[field];
        const showEstimate = !hasStoredValue && estimateValue != null && !touched.has(field);
        const displayValue = hasStoredValue ? values[field] : showEstimate ? estimateValue : "";

        return (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-slate-700">
              {formatFieldLabel(field)}
            </label>
            {showEstimate && (
              <p className="text-xs text-slate-400">Estimated: adjust to match you</p>
            )}
            <input
              id={field}
              type="number"
              step="0.1"
              value={displayValue}
              onChange={handleChange(field)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        );
      })}
    </div>
  );
}

export default MeasurementSliderPanel;
