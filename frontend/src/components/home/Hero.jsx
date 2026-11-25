const STRIP = [
  { src: "/assets/photos/hero-suit-cuff.jpg", alt: "A man buttoning a dark blue suit jacket", label: "Double-breasted suit" },
  { src: "/assets/photos/approaches-fabric-swatches.jpg", alt: "Wool suit-fabric swatches on a tailor's table", label: "Fabric, chosen in person" },
  { src: "/assets/photos/process-measure.jpg", alt: "A hand holding a measuring tape", label: "Measured twice" },
  { src: "/assets/photos/process-stitch.jpg", alt: "A sewing machine at work", label: "Stitched by hand" },
  { src: "/assets/photos/process-finish.jpg", alt: "Hands finishing a seam", label: "Finished for you" },
];

export default function Hero({ onLetsGo }) {
  return (
    <section className="hero hero--bg" data-enter aria-labelledby="hero-h">
      <div className="hero-bg">
        <img src={STRIP[0].src} alt={STRIP[0].alt} fetchPriority="high" />
      </div>
      <div className="wrap hero-body">
        <h1 id="hero-h" className="hero-title">Custom tailoring, made to your measure</h1>
        <p className="t-lead">We guide the fabric, the fit and the finish in person.</p>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={onLetsGo}>
            Book a consultation
          </button>
          <a className="btn btn--secondary" href="#how-it-works">See how it works</a>
        </div>
      </div>
      <ul className="hero-strip" aria-label="Recent work">
        {STRIP.map((item) => (
          <li key={item.src} className="hero-strip__item">
            <figure>
              <img src={item.src} alt={item.alt} loading="lazy" />
              <figcaption>{item.label}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
