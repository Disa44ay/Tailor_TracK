import Logo from "../brand/Logo.jsx";
import { useLanguage } from "../../app/LanguageContext.jsx";

const COPY = {
  bn: {
    heading: "পরামর্শের জন্য বুক করুন",
    lede: "একটি কাস্টম ক্লোথিং স্টুডিও।",
    explore: "ঘুরে দেখুন",
    onFit: "ফিট নিয়ে",
    approaches: "আমাদের পদ্ধতি",
    howItWorks: "কীভাবে কাজ করে",
    contact: "যোগাযোগ",
    writeToUs: "আমাদের লিখুন",
    creditsSummary: "আলোকচিত্র: Ruthson Zimmerman ও Yasamine June, Unsplash থেকে",
  },
  en: {
    heading: "Book a consultation",
    lede: "A custom clothing studio.",
    explore: "Explore",
    onFit: "On fit",
    approaches: "Approaches",
    howItWorks: "How it works",
    contact: "Contact",
    writeToUs: "Write to us",
    creditsSummary: "Photographs: Ruthson Zimmerman and Yasamine June, via Unsplash",
  },
};

export default function Footer({ onBookConsultation }) {
  const { lang } = useLanguage();
  const t = COPY[lang];

  return (
    <footer className="footer closing" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--type">
          <div className="section-head">
            <h2 id="close-h">{t.heading}</h2>
          </div>
          <button type="button" className="btn btn--primary btn--xl" onClick={onBookConsultation}>
            {t.heading}
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </button>
        </div>

        <div className="closing__links">
          <div className="grid">
            <div className="span-6 stack-5">
              <a className="nav__logo" href="#top">
                <Logo className="text-[22px]" />
              </a>
              <p className="footer__lede">{t.lede}</p>
            </div>
            <div className="span-3 start-7 footer__col">
              <h4>{t.explore}</h4>
              <ul>
                <li>
                  <a href="#fit">{t.onFit}</a>
                </li>
                <li>
                  <a href="#approaches">{t.approaches}</a>
                </li>
                <li>
                  <a href="#how-it-works">{t.howItWorks}</a>
                </li>
              </ul>
            </div>
            <div className="span-3 start-10 footer__col">
              <h4>{t.contact}</h4>
              <ul>
                <li>
                  <a href="mailto:hello@oboyob.example">{t.writeToUs}</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>&copy; 2026 অবয়ব</span>
            <details className="credits">
              <summary>{t.creditsSummary}</summary>
              <p>
                Suit-cuff photograph by Ruthson Zimmerman; fabric-swatch photograph by Yasamine June.
                Both free to use under the Unsplash License.
              </p>
            </details>
          </div>
        </div>
      </div>
    </footer>
  );
}
