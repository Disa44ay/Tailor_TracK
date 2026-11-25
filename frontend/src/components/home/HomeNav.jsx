import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../brand/Logo.jsx";
import { useLanguage } from "../../app/LanguageContext.jsx";

const COPY = {
  bn: { howItWorks: "কীভাবে কাজ করে", login: "লগ ইন", menu: "মেনু", skip: "মূল অংশে যান" },
  en: { howItWorks: "How it works", login: "Log in", menu: "Menu", skip: "Skip to content" },
};

export default function HomeNav({ onLogin }) {
  const [open, setOpen] = useState(false);
  const { lang, toggleLang } = useLanguage();
  const t = COPY[lang];
  const LINKS = [{ label: t.howItWorks, href: "#how-it-works" }];

  return (
    <header className={`nav nav--centre${open ? " is-open" : ""}`}>
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          {t.skip}
        </a>
        <Link to="/" className="nav__logo">
          <Logo className="text-[22px]" />
        </Link>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((link) => (
            <div className="nav__item" key={link.label}>
              <a className="nav__link" href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </div>
          ))}
        </nav>

        <div className="nav__actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={toggleLang}>
            {lang === "bn" ? "EN" : "বাং"}
          </button>
          <button type="button" className="btn btn--primary" onClick={onLogin}>
            {t.login}
          </button>
        </div>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            {open ? (
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
