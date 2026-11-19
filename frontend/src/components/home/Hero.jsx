import { Link } from "react-router-dom";

function CornerBrackets() {
  // shortcut: fixed 10px bracket size tuned for these button sizes; revisit if button padding changes a lot.
  const arm = "absolute h-2.5 w-2.5 border-ink";
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className={`${arm} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${arm} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${arm} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${arm} bottom-0 right-0 border-b-2 border-r-2`} />
    </span>
  );
}

function PrimaryCta() {
  return (
    <Link
      to="/signup"
      className="relative inline-block border-2 border-dashed border-ink bg-accent px-6 py-3 font-home-body text-paper shadow-[3px_3px_0_0_var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{
        // shortcut: highlight stop stays literal white (no "highlight-white" token exists yet); the shadow stop is derived from --color-ink via color-mix so it still tracks theme changes.
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(circle at 80% 75%, color-mix(in srgb, var(--color-ink) 18%, transparent), transparent 55%)",
      }}
    >
      <CornerBrackets />
      Let&apos;s go
    </Link>
  );
}

function SecondaryCta() {
  return (
    <a
      href="#how-it-works"
      className="relative inline-block border-2 border-ink bg-paper px-6 py-3 font-home-body text-ink shadow-[3px_3px_0_0_var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{
        // shortcut: highlight stop stays literal white (no "highlight-white" token exists yet); the shadow stop is derived from --color-ink via color-mix so it still tracks theme changes.
        backgroundImage:
          "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4), transparent 55%), radial-gradient(circle at 75% 80%, color-mix(in srgb, var(--color-ink) 8%, transparent), transparent 55%)",
      }}
    >
      <CornerBrackets />
      See how it works
    </a>
  );
}

function GarmentIllustration() {
  // shortcut: hand-drawn silhouette approximated with simple paths; raw hex is allowed only inside this inline SVG per Task 1's SVG exception.
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none" aria-hidden="true">
      <path
        d="M80 40 L95 25 L125 25 L140 40 L160 55 L150 85 L135 78 L135 190 L85 190 L85 78 L70 85 L60 55 Z"
        stroke="#2B2A28"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="110" cy="95" r="3" stroke="#2B2A28" strokeWidth="2" />
      <circle cx="110" cy="120" r="3" stroke="#2B2A28" strokeWidth="2" />
      <circle cx="110" cy="145" r="3" stroke="#2B2A28" strokeWidth="2" />
      <path
        d="M20 180 Q60 140 95 165 Q130 190 170 150"
        stroke="#203A8C"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="35" y1="172" x2="38" y2="165" stroke="#203A8C" strokeWidth="1.5" />
      <line x1="55" y1="155" x2="59" y2="149" stroke="#203A8C" strokeWidth="1.5" />
      <line x1="100" y1="168" x2="99" y2="160" stroke="#203A8C" strokeWidth="1.5" />
      <line x1="140" y1="172" x2="142" y2="165" stroke="#203A8C" strokeWidth="1.5" />
      <path
        d="M170 50 q10 10 0 20 t0 20"
        stroke="#2B2A28"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="170" cy="48" r="2" fill="#2B2A28" />
    </svg>
  );
}

function StickyNote({ rotate, label, status }) {
  return (
    <div
      className="w-36 border border-ink bg-highlighter/40 p-3 font-home-body text-sm text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <p className="font-hand text-base">{label}</p>
      <p>{status}</p>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="bg-paper px-6 py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <div>
          <h1 className="font-hand text-4xl text-ink md:text-5xl">
            You imagine it. We tailor it{" "}
            <span
              className="relative inline-block mix-blend-multiply"
              style={{
                borderRadius: "40% 60% 55% 45% / 60% 35% 65% 40%",
                transform: "rotate(-1.5deg)",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -inset-y-1 bg-highlighter"
                style={{
                  borderRadius: "40% 60% 55% 45% / 60% 35% 65% 40%",
                }}
              />
              <span className="relative">real</span>
            </span>
            .
          </h1>
          <p className="mt-6 font-home-body text-lg text-ink">
            Measurements, orders, and fittings &mdash; kept the way your tailor already keeps them. On paper, just faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <PrimaryCta />
            <SecondaryCta />
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <GarmentIllustration />
          <div className="absolute -top-4 right-0">
            <StickyNote rotate={-4} label="#108 — Suit" status="ready for pickup" />
          </div>
          <div className="absolute bottom-0 left-0">
            <StickyNote rotate={3} label="#112 — Panjabi" status="2 ready for pickup" />
          </div>
        </div>
      </div>
    </section>
  );
}
