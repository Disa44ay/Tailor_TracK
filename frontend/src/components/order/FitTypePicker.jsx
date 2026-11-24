import { FIT_OPTIONS_BY_GARMENT } from "./fitOptionsByGarment.js";

// Hallmark · component: button row · floor: 0 FAIL · reflex: 1 waived (26b — the
// fit list per dress type is fixed in fitOptionsByGarment.js, so no disabled state is reachable)
function formatFit(fit) {
  const text = fit.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function FitTypePicker({ dressType, selected = null, onSelect }) {
  const fits = FIT_OPTIONS_BY_GARMENT[dressType] ?? [];
  return (
    <div className="flex flex-wrap gap-2">
      {fits.map((fit) => (
        <button
          key={fit}
          type="button"
          aria-pressed={selected === fit}
          onClick={() => onSelect?.(fit)}
          className={`rounded-lg border-2 px-3 py-1.5 font-title text-xs text-ink transition-transform motion-reduce:transition-none hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0 ${
            selected === fit ? "border-accent bg-accent/5" : "border-ink/30 bg-paper"
          }`}
        >
          {formatFit(fit)}
        </button>
      ))}
    </div>
  );
}

export default FitTypePicker;
