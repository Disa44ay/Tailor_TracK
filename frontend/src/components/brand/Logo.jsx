// The chosen "Experimental" wordmark direction (plan.md §0): অবয়ব split into
// three weights in Anek Bangla, the middle segment in the accent colour.
function Logo({ className = "" }) {
  return (
    <span
      lang="bn"
      className={`inline-flex items-baseline gap-[0.02em] ${className}`}
      style={{ fontFamily: "'Anek Bangla', sans-serif" }}
      aria-label="অবয়ব"
    >
      <span aria-hidden="true" style={{ fontWeight: 800 }}>
        অ
      </span>
      <span aria-hidden="true" style={{ fontWeight: 300, color: "var(--p-accent)" }}>
        বয়
      </span>
      <span aria-hidden="true" style={{ fontWeight: 800 }}>
        ব
      </span>
    </span>
  );
}

export default Logo;
