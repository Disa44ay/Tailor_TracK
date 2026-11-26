const STEPS = [
  { no: "01", title: "Send an enquiry", body: "Tell us the garment and the occasion." },
  { no: "02", title: "Book a fitting", body: "A call or a visit to the studio." },
  { no: "03", title: "Decide the fit", body: "Fabric and fit, chosen in person." },
  { no: "04", title: "Collect your piece", body: "Ready to wear, made to your measure." },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how-it-works" aria-labelledby="how-it-works-h">
      <div className="wrap grid grid--middle">
        <div className="span-6">
          <h2 id="how-it-works-h" className="how-title">How it works</h2>
          <div className="btn-row">
            <a className="btn btn--primary" href="#top">
              Book a consultation
            </a>
          </div>
        </div>
        <ol className="how-list span-6 start-7">
          {STEPS.map((s) => (
            <li key={s.no} className="how-item">
              <span className="how-item__no">{s.no}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
