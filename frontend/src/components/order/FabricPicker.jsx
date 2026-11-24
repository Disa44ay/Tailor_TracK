import { useState } from "react";

// Hallmark · component: card grid · floor: 0 FAIL · reflex: 1 waived (26b — the
// backend only ever returns active fabrics, so no disabled state is reachable)
const SKELETON_COUNT = 6;

function FabricCard({ fabric, selected, onSelect }) {
  const [imageBroken, setImageBroken] = useState(false);

  return (
    <button
      type="button"
      role="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(fabric.id)}
      className={`flex flex-col gap-1 rounded-lg border-2 p-1.5 text-left transition-transform motion-reduce:transition-none hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0 ${
        selected ? "border-accent bg-accent/5" : "border-ink/30 bg-paper"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-ink/20">
        {fabric.swatch_image_url && !imageBroken ? (
          <img
            src={fabric.swatch_image_url}
            alt={fabric.name}
            onError={() => setImageBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            data-testid="fabric-fill"
            data-texture={fabric.texture}
            style={{ backgroundColor: fabric.color_hex }}
            className="h-full w-full"
          />
        )}
        {selected && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent font-home-body text-[10px] text-paper"
          >
            ✓
          </span>
        )}
      </div>

      <p className="font-title text-xs text-ink">{fabric.name}</p>
      <p className="font-home-body text-[11px] text-ink/70">
        {fabric.print_pattern}, {fabric.texture}
      </p>
    </button>
  );
}

function FabricSkeletonCard() {
  return (
    <div
      data-testid="fabric-skeleton-card"
      className="flex flex-col gap-1 rounded-lg border-2 border-ink/10 p-1.5"
    >
      <div className="aspect-square w-full animate-pulse motion-reduce:animate-none rounded-md bg-ink/10" />
      <div className="h-2.5 w-2/3 animate-pulse motion-reduce:animate-none rounded bg-ink/10" />
      <div className="h-2 w-1/2 animate-pulse motion-reduce:animate-none rounded bg-ink/10" />
    </div>
  );
}

function FabricPicker({ fabrics = [], loading = false, error = null, selectedId = null, onSelect }) {
  if (error) {
    return (
      <p className="font-home-body text-sm text-urgent" role="alert">
        {error}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <FabricSkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (fabrics.length === 0) {
    return <p className="font-home-body text-sm text-ink/70">No fabrics yet. Check back soon.</p>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
      {fabrics.map((fabric) => (
        <FabricCard
          key={fabric.id}
          fabric={fabric}
          selected={fabric.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default FabricPicker;
