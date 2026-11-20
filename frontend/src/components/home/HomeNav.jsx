import { useState } from "react";
import { Link } from "react-router-dom";

function Tick() {
  return <span aria-hidden="true" className="block h-2 w-[1.5px] bg-ink" />;
}

function NavLink({ label, href, onClick }) {
  const className =
    "font-home-body text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm";
  return (
    <span className="flex flex-col items-center gap-1">
      <Tick />
      {onClick ? (
        <button type="button" onClick={onClick} className={className}>
          {label}
        </button>
      ) : (
        <a href={href} className={className}>
          {label}
        </a>
      )}
    </span>
  );
}

function TapeMeasureCaseIcon() {
  // shortcut: hand-drawn icon approximated with a rounded rect + dial.
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-ink">
      <rect x="3" y="3" width="22" height="22" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TapeMeasureUnrolledIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-ink">
      <rect x="3" y="11" width="22" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="11" x2="7" y2="17" stroke="currentColor" strokeWidth="1" />
      <line x1="11" y1="11" x2="11" y2="17" stroke="currentColor" strokeWidth="1" />
      <line x1="15" y1="11" x2="15" y2="17" stroke="currentColor" strokeWidth="1" />
      <line x1="19" y1="11" x2="19" y2="17" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function HomeNav({ onLogin }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Log in", onClick: onLogin },
  ];

  return (
    <nav className="border-b border-ink bg-paper px-4 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-hand text-xl text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm">
          TailorTrack
        </Link>

        <div className="hidden items-end gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.label} {...link} />
          ))}
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="home-mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-ink md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
        >
          {open ? <TapeMeasureUnrolledIcon /> : <TapeMeasureCaseIcon />}
          <span className="font-home-body">Menu</span>
        </button>
      </div>

      <div
        id="home-mobile-menu"
        aria-hidden={!open}
        // shortcut: max-h-40 is comfortably above this short link list; raise it if LINKS grows enough to clip.
        className={`origin-left overflow-hidden transition-[scale,opacity,max-height] duration-200 ease-in-out motion-reduce:transition-none md:hidden ${
          open ? "max-h-40 scale-x-100 opacity-100" : "pointer-events-none max-h-0 scale-x-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-3 pt-3">
          {links.map((link) =>
            link.onClick ? (
              <button
                key={link.label}
                type="button"
                tabIndex={open ? undefined : -1}
                onClick={() => {
                  setOpen(false);
                  link.onClick();
                }}
                className="text-left font-home-body text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                tabIndex={open ? undefined : -1}
                onClick={() => setOpen(false)}
                className="font-home-body text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
              >
                {link.label}
              </a>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
