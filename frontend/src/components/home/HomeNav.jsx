import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../brand/Logo.jsx";
import { useAuth } from "../../app/AuthContext.jsx";
import { Dot } from "../inquiries/InquiriesPanel.jsx";

const LINKS = [{ label: "How it works", href: "#how-it-works" }];

export default function HomeNav({ onLogin, onBook, onInquiries, inquiryDot = null }) {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const user = auth?.user;
  const signedIn = Boolean(auth?.token && user);
  const username = user?.firstName || user?.name || "";
  const logout = auth?.logout;

  return (
    <header className={`nav nav--centre${open ? " is-open" : ""}`}>
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Skip to content
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
          {signedIn && (
            <div className="nav__item">
              <button type="button" className="nav__link" onClick={() => { setOpen(false); onInquiries?.(); }}>
                My inquiries
                <Dot color={inquiryDot} />
              </button>
            </div>
          )}
        </nav>

        <div className="nav__actions">
          {signedIn ? (
            <>
              <button type="button" className="btn btn--primary" onClick={onBook}>
                Welcome, {username}
              </button>
              <button type="button" className="nav__icon" aria-label="Log out" title="Log out" onClick={() => logout?.()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" aria-hidden="true">
                  <path d="M10 4H4v16h6" />
                  <path d="M15 8l4 4-4 4" />
                  <path d="M19 12H9" />
                </svg>
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--primary" onClick={onLogin}>
              Log in
            </button>
          )}
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
