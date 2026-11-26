const STEPS = [
  { no: "01", word: "Measure", src: "/assets/photos/process-measure.jpg", alt: "A hand holding a measuring tape" },
  { no: "02", word: "Cut", src: "/assets/photos/process-cut.jpg", alt: "Fabric being cut with scissors" },
  { no: "03", word: "Stitch", src: "/assets/photos/process-stitch.jpg", alt: "A sewing machine at work" },
  { no: "04", word: "Finish", src: "/assets/photos/process-finish.jpg", alt: "Hands finishing a seam with a needle and thread" },
];

export default function Process() {
  return (
    <section className="section process" id="process" aria-labelledby="process-h">
      <div className="wrap">
        <h2 id="process-h" className="process-title">From cloth to fit</h2>
        <ol className="process-grid">
          {STEPS.map((s) => (
            <li key={s.no} className="process-tile">
              <div className="frame frame--photo frame--portrait">
                <img className="frame__img" src={s.src} alt={s.alt} fetchPriority={s.no === "01" ? "high" : undefined} loading={s.no === "01" ? undefined : "lazy"} />
              </div>
              <span className="process-tile__no">{s.no}</span>
              <h3>{s.word}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
