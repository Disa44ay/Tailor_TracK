import { useLayoutEffect, useRef } from "react";

const DIAGRAM_SPEC = {
  layout: "timeline",
  ground: "none",
  motion: { pulse: "none" },
  alt: "A customer tells the studio what they want, the studio arranges a fitting, the fabric and fit are decided in person, and the finished piece is collected.",
  steps: [
    { label: "Enquiry sent", sub: "Service + garment", icon: "ui:message-circle" },
    { label: "Fitting booked", sub: "Call or visit", icon: "ui:calendar-check" },
    { label: "Fit decided", sub: "In person", icon: "ui:scissors" },
    { label: "Piece collected", sub: "Ready to wear", icon: "ui:package-check" },
  ],
};

export default function HowItWorks() {
  const diagramRef = useRef(null);

  useLayoutEffect(() => {
    window.__mountDiagram?.(diagramRef.current);
  }, []);

  return (
    <section className="section" id="how-it-works" aria-labelledby="how-it-works-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="how-it-works-h">How it works</h2>
        </div>
        <div
          ref={diagramRef}
          className="dg"
          data-diagram=""
          role="img"
          aria-label={DIAGRAM_SPEC.alt}
        >
          <script type="application/json">{JSON.stringify(DIAGRAM_SPEC)}</script>
        </div>
        <div className="btn-row">
          <a className="btn btn--primary" href="#top">
            Book a consultation
          </a>
        </div>
      </div>
    </section>
  );
}
