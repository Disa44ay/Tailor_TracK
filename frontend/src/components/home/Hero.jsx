import { useLanguage } from "../../app/LanguageContext.jsx";

const COPY = {
  bn: {
    headline: "সঠিক ফিট চান এমন পুরুষদের জন্য কাস্টম টেইলারিং",
    lead: "অবয়ব একটি কাস্টম ক্লোথিং স্টুডিও। আপনি কী চান বলুন, আমরা সরাসরি সাক্ষাতে কাপড়, ফিট ও ফিনিশ বেছে নিতে সাহায্য করব – কোনো সাইজ চার্ট নয়।",
    primary: "পরামর্শের জন্য বুক করুন",
    secondary: "কীভাবে কাজ করে দেখুন",
    alt: "একজন পুরুষ গাঢ় নীল স্যুটের বোতাম লাগাচ্ছেন, তার হাত ও কব্জিঘড়ি দেখা যাচ্ছে",
  },
  en: {
    headline: "Custom tailoring for men who want it right",
    lead: "অবয়ব is a custom clothing studio. Tell us what you’re after and we’ll guide the fabric, the fit and the finish in person – not a size chart.",
    primary: "Book a consultation",
    secondary: "See how it works",
    alt: "A man buttoning a dark blue suit jacket, his hands and wristwatch in view",
  },
};

export default function Hero({ onLetsGo }) {
  const { lang } = useLanguage();
  const t = COPY[lang];

  return (
    <section className="hero hero--split" data-enter aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text grid hero-split">
          <div className="hero-copy span-7">
            <h1 id="hero-h" className="hero-title">{t.headline}</h1>
            <p className="t-lead">{t.lead}</p>
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={onLetsGo}>
                {t.primary}
                <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                  <path className="m-arrow__stem" d="M1 6h8" />
                  <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                </svg>
              </button>
              <a className="btn btn--secondary" href="#how-it-works">
                {t.secondary}
              </a>
            </div>
          </div>
          <div className="hero-visual frame frame--photo span-5 start-8">
            <img
              className="frame__img"
              src="/assets/photos/hero-suit-cuff.jpg"
              alt={t.alt}
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
