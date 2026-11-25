export default function Hero({ onLetsGo }) {
  return (
    <section className="hero hero--split" data-enter aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text grid hero-split">
          <div className="hero-copy span-7">
            <h1 id="hero-h" className="hero-title">
              Custom tailoring for men who want it right
            </h1>
            <p className="t-lead">
              Oboyob is a custom clothing studio. Tell us what you&rsquo;re after and we&rsquo;ll guide the
              fabric, the fit and the finish in person &ndash; not a size chart.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={onLetsGo}>
                Book a consultation
                <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                  <path className="m-arrow__stem" d="M1 6h8" />
                  <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                </svg>
              </button>
              <a className="btn btn--secondary" href="#how-it-works">
                See how it works
              </a>
            </div>
          </div>
          <div className="hero-visual frame frame--photo span-5 start-8">
            <img
              className="frame__img"
              src="/assets/photos/hero-suit-cuff.jpg"
              alt="A man buttoning a dark blue suit jacket, his hands and wristwatch in view"
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
