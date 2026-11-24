// Hallmark · component: button row · floor: 0 FAIL · reflex: 1 waived (26b — the
// dress-type list is fixed in this file, so no disabled state is reachable)
const DRESS_TYPES = [
  { value: "shirt", label: "Shirt" },
  { value: "pant", label: "Pant" },
  { value: "panjabi", label: "Panjabi" },
  { value: "suit", label: "Suit" },
  { value: "paijama", label: "Paijama" },
];

function DressTypePicker({ selected = null, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DRESS_TYPES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={selected === value}
          onClick={() => onSelect?.(value)}
          className={`rounded-lg border-2 px-3 py-1.5 font-title text-xs text-ink transition-transform motion-reduce:transition-none hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0 ${
            selected === value ? "border-accent bg-accent/5" : "border-ink/30 bg-paper"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default DressTypePicker;
