import { useState, useRef } from "react";

const SLIDES = [
  { src: "/assets/photos/slider1.jpg", alt: "A navy suit lapel pinned with basting thread before the fitting", pos: "50% 50%", no: "01", title: "Pinned before the fitting", note: "The jacket is basted in place so the line can be judged on you." },
  { src: "/assets/photos/slider2.jpg", alt: "A tape measure taken across a man's chest", pos: "50% 92%", no: "02", title: "Measured across the chest", note: "A tape first, then the fabric is chosen against your build." },
  { src: "/assets/photos/slider3.jpg", alt: "Tailor's chalk marking a navy pinstripe shoulder", pos: "50% 50%", no: "03", title: "Marked on the cloth", note: "Every line is chalked on the shoulder, then sewn to that mark." },
];

export default function Hero({ onLetsGo }) {
  const [active, setActive] = useState(0);
  const stripRef = useRef(null);

  function onScroll() {
    const el = stripRef.current;
    if (!el || !el.firstElementChild) return;
    const step = el.firstElementChild.offsetWidth + 16;
    setActive(Math.min(SLIDES.length - 1, Math.round(el.scrollLeft / step)));
  }

  function goTo(i) {
    const el = stripRef.current;
    if (!el || !el.children[i]) return;
    el.scrollTo({ left: el.children[i].offsetLeft - el.children[0].offsetLeft, behavior: "smooth" });
  }

  const current = SLIDES[active];

  return (
    <section className="hero hero--tara" data-enter aria-labelledby="hero-h">
      <div className="hero-bg" aria-hidden="true">
        <img src="/assets/photos/hero_sec_BG2.jpg" alt="" />
      </div>
      <div className="wrap hero-tara">
        <h1 id="hero-h" className="hero-title">
          <span>Custom tailoring,</span>{" "}
          <span className="hero-title__line2">made to your measure</span>
        </h1>
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
          </div>
        </div>
        <ul className="hero-slider" ref={stripRef} onScroll={onScroll} aria-label="Recent work">
          {SLIDES.map((item) => (
            <li key={item.src} className="hero-slider__item">
              <figure>
                <img src={item.src} alt={item.alt} style={{ objectPosition: item.pos }} loading="lazy" />
              </figure>
            </li>
          ))}
        </ul>
        <ul className="hero-progress" aria-label="Choose a photo">
          {SLIDES.map((item, i) => (
            <li key={item.src}>
              <button
                type="button"
                className={i === active ? "is-active" : ""}
                aria-label={`Show ${i + 1} of ${SLIDES.length}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
