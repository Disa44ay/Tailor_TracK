const ITEMS = [
  { name: "Italian suit", note: "Soft shoulders and a natural waist, cut in Naples style.", src: "/assets/photos/showcase-italian-suit.jpg", alt: "A navy Italian-cut suit on a hanger" },
  { name: "Double-breasted suit", note: "Two rows of buttons and a wider lapel, for occasions.", src: "/assets/photos/showcase-double-breasted.jpg", alt: "A double-breasted suit jacket, buttoned" },
  { name: "Bootcut trousers", note: "A gentle flare below the knee, over a clean shoe.", src: null, alt: null },
  { name: "Straight-fit trousers", note: "A clean line from hip to hem, for daily wear.", src: null, alt: null },
  { name: "Formal shirt", note: "A stiff collar and a fitted body, for work and events.", src: null, alt: null },
  { name: "Cuban shirt", note: "A relaxed open collar and a boxy cut, for warm days.", src: null, alt: null },
];

export default function Showcase() {
  return (
    <section className="section home-showcase" id="what-we-make" aria-labelledby="what-we-make-h">
      <div className="wrap">
        <h2 id="what-we-make-h">What we make</h2>
        <ol className="showcase-grid">
          {ITEMS.map((item) => (
            <li key={item.name} className="showcase-item">
              {item.src && (
                <div className="frame frame--photo frame--portrait">
                  <img className="frame__img" src={item.src} alt={item.alt} loading="lazy" />
                </div>
              )}
              <h3>{item.name}</h3>
              <p>{item.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
