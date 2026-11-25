import { useState, useRef } from "react";

const STRIP = [
  { src: "/assets/photos/hero-suit-cuff.jpg", alt: "A man buttoning a navy suit jacket", no: "01", title: "Tailored in navy", note: "A single-breasted jacket cut to your shoulders and sleeves." },
  { src: "/assets/photos/approaches-fabric-swatches.jpg", alt: "Wool suit-fabric swatches on a tailor's table", no: "02", title: "Fabric, chosen in person", note: "Swatches laid out so you can judge the cloth against your skin." },
  { src: "/assets/photos/process-measure.jpg", alt: "A hand holding a measuring tape", no: "03", title: "Measured twice", note: "A tape measure first, then a fitting that checks the fit as you move." },
  { src: "/assets/photos/process-stitch.jpg", alt: "A sewing machine at work", no: "04", title: "Stitched on the machine", note: "Seams sewn to the pattern we agreed on at the fitting." },
  { src: "/assets/photos/process-finish.jpg", alt: "Hands finishing a seam", no: "05", title: "Finished for you", note: "Hand-finished edges, pressed and ready to wear." },
];

export default function Hero({ onLetsGo }) {
  const [active, setActive] = useState(0);
  const stripRef = useRef(null);

  function onScroll() {
    const el = stripRef.current;
    if (!el || !el.firstElementChild) return;
    const step = el.firstElementChild.offsetWidth + 16;
    setActive(Math.min(STRIP.length - 1, Math.round(el.scrollLeft / step)));
  }

  const current = STRIP[active];

  return (
    <section className="hero hero--tara" data-enter aria-labelledby="hero-h">
      <div className="hero-bg">
        <img src={STRIP[0].src} alt={STRIP[0].alt} fetchPriority="high" />
      </div>
      <div className="wrap hero-tara">
        <h1 id="hero-h" className="hero-title">Custom tailoring, made to your measure</h1>
        <div className="hero-tara__panel">
          <p className="hero-tara__caption">
            <span className="hero-tara__no">{current.no}</span>
            <span className="hero-tara__name">{current.title}</span>
          </p>
          <p className="hero-tara__note">{current.note}</p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={onLetsGo}>
              Book a consultation
            </button>
            <a className="btn btn--secondary" href="#how-it-works">See how it works</a>
          </div>
        </div>
        <ul className="hero-strip" ref={stripRef} onScroll={onScroll} tabIndex={0} aria-label="Recent work">
          {STRIP.map((item) => (
            <li key={item.src} className="hero-strip__item">
              <figure>
                <img src={item.src} alt={item.alt} loading="lazy" />
              </figure>
            </li>
          ))}
        </ul>
        <div className="hero-progress" aria-hidden="true">
          {STRIP.map((item, i) => (
            <span key={item.src} className={i === active ? "is-active" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}
