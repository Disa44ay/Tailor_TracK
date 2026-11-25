export default function Hero({ onLetsGo }) {
  return (
    <section className="hero hero--statement" data-enter aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text hero__in">
          <h1 id="hero-h">Custom tailoring for men who want it right</h1>
          <p className="hero__lead">
            অবয়ব is a custom clothing studio. Tell us what you&rsquo;re after and we&rsquo;ll guide
            the fabric, the fit and the finish in person &ndash; not a size chart.
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
      </div>
    </section>
  );
}
