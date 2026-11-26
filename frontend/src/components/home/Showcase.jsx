const ITEMS = [
  { name: "Italian suit", note: "A three-piece in blue windowpane check, with a waistcoat under the jacket.", src: "/assets/photos/showcase-italian-suit.jpg", alt: "A blue windowpane-check three-piece suit" },
  { name: "Double-breasted suit", note: "Two rows of buttons and a wider lapel, for occasions.", src: "/assets/photos/doublebreasted2.jpg", alt: "A brown double-breasted suit worn with its jacket buttoned" },
  { name: "Bootcut trousers", note: "A gentle flare below the knee, over a clean shoe.", src: "/assets/photos/boptcut1.jpg", alt: "Black bootcut trousers with a gentle flare" },
  { name: "Straight-fit trousers", note: "A clean line from hip to hem, for daily wear.", src: "/assets/photos/straightFitPant.jpg", alt: "Straight-fit trousers with a clean line" },
  { name: "Formal shirt", note: "A stiff collar and a fitted body, for work and events.", src: "/assets/photos/formalShirt.jpg", alt: "A formal shirt with a stiff collar" },
  { name: "Cuban shirt", note: "A relaxed open collar and a boxy cut, for warm days.", src: "/assets/photos/cubanShirt.jpg", alt: "A Cuban-collar shirt with a relaxed cut" },
];

export default function Showcase() {
  return (
    <section className="section home-showcase" id="what-we-make" aria-labelledby="what-we-make-h">
      <div className="wrap">
        <h2 id="what-we-make-h">What we make</h2>
        <ol className="showcase-grid">
          {ITEMS.map((item, i) => (
            <li key={item.name} className="showcase-item">
              {item.src && (
                <div className="frame frame--photo frame--portrait">
                  <img className="frame__img" src={item.src} alt={item.alt} fetchPriority={i === 0 ? "high" : undefined} loading={i === 0 ? undefined : "lazy"} />
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
