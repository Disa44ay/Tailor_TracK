import { useLayoutEffect, useRef } from "react";
import { useLanguage } from "../../app/LanguageContext.jsx";

const COPY = {
  bn: {
    label: "ফিট নিয়ে",
    before: "আমরা আপনার মাপ দুইবার নিই: একবার ফিতা দিয়ে, একবার চোখে দেখে, নড়াচড়ার সময় কাপড় কেমন বসছে তা লক্ষ করে, যতক্ষণ না ",
    strong: "ফিট",
    after: " মনে হয় এটা সবসময় এমনই ছিল।",
  },
  en: {
    label: "On fit",
    before: "We take your measurements twice: once with a tape, once by eye, watching how the fabric sits on you as you move, until the ",
    strong: "fit",
    after: " looks like it was always there.",
  },
};

export default function FitStatement() {
  const sectionRef = useRef(null);
  const { lang } = useLanguage();
  const t = COPY[lang];

  useLayoutEffect(() => {
    window.__mountMoment?.(sectionRef.current);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section statement"
      id="fit"
      data-moment="word-highlight"
      aria-label={t.label}
    >
      <div className="wrap">
        <p className="t-label">{t.label}</p>
        <p className="mo-wh__text">
          {t.before}
          <strong>{t.strong}</strong>
          {t.after}
        </p>
      </div>
    </section>
  );
}
