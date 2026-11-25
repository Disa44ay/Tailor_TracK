import { useLayoutEffect, useRef } from "react";
import { useLanguage } from "../../app/LanguageContext.jsx";

const DIAGRAM_SPEC = {
  bn: {
    alt: "ক্রেতা স্টুডিওকে জানান তিনি কী চান, স্টুডিও একটি ফিটিং ঠিক করে, কাপড় ও ফিট সরাসরি সাক্ষাতে চূড়ান্ত হয়, এবং তৈরি পোশাক সংগ্রহ করা হয়।",
    steps: [
      { label: "অনুরোধ পাঠানো হয়েছে", sub: "সেবা + পোশাক", icon: "ui:message-circle" },
      { label: "ফিটিং বুক করা হয়েছে", sub: "কল অথবা সরাসরি", icon: "ui:calendar-check" },
      { label: "ফিট চূড়ান্ত", sub: "সরাসরি সাক্ষাতে", icon: "ui:scissors" },
      { label: "পোশাক সংগ্রহ", sub: "পরার জন্য প্রস্তুত", icon: "ui:package-check" },
    ],
  },
  en: {
    alt: "A customer tells the studio what they want, the studio arranges a fitting, the fabric and fit are decided in person, and the finished piece is collected.",
    steps: [
      { label: "Enquiry sent", sub: "Service + garment", icon: "ui:message-circle" },
      { label: "Fitting booked", sub: "Call or visit", icon: "ui:calendar-check" },
      { label: "Fit decided", sub: "In person", icon: "ui:scissors" },
      { label: "Piece collected", sub: "Ready to wear", icon: "ui:package-check" },
    ],
  },
};

const COPY = {
  bn: { heading: "কীভাবে কাজ করে", cta: "পরামর্শের জন্য বুক করুন" },
  en: { heading: "How it works", cta: "Book a consultation" },
};

export default function HowItWorks() {
  const diagramRef = useRef(null);
  const { lang } = useLanguage();
  const t = COPY[lang];
  const spec = { layout: "timeline", ground: "none", motion: { pulse: "none" }, ...DIAGRAM_SPEC[lang] };

  useLayoutEffect(() => {
    window.__mountDiagram?.(diagramRef.current);
  }, []);

  return (
    <section className="section" id="how-it-works" aria-labelledby="how-it-works-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="how-it-works-h">{t.heading}</h2>
        </div>
        <div ref={diagramRef} className="dg" data-diagram="" role="img" aria-label={spec.alt}>
          <script type="application/json">{JSON.stringify(spec)}</script>
        </div>
        <div className="btn-row">
          <a className="btn btn--primary" href="#top">
            {t.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
