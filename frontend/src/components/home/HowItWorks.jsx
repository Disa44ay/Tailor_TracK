const STEPS = [
  {
    title: "Save your measurements",
    description: "Enter them once; every order reuses them.",
  },
  {
    title: "Place an order",
    description: "Pick the garment and due date, and the order is logged.",
  },
  {
    title: "Pay the advance",
    description: "Settle it online through SSLCommerz.",
  },
  {
    title: "Track it to pickup",
    description: "See exactly where the order stands, start to finish.",
  },
];

function MeasurementBox({ children }) {
  return (
    <div className="relative border-2 border-ink bg-paper p-6">
      <span aria-hidden="true" className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-ink" />
      <span aria-hidden="true" className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-ink" />
      <span aria-hidden="true" className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-ink" />
      <span aria-hidden="true" className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-ink" />
      {children}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-paper px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-hand text-3xl text-ink md:text-4xl">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <MeasurementBox>
                <p className="font-title text-sm text-accent">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-home-body text-lg text-ink">{step.title}</p>
                <p className="mt-2 font-home-body text-sm text-ink">{step.description}</p>
              </MeasurementBox>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
