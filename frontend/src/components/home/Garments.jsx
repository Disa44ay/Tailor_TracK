const ITEMS = [
  { no: "01", name: "Suit", note: "Two or three buttons, for work or occasions" },
  { no: "02", name: "Panjabi", note: "Plain or embroidered, for festivals and events" },
  { no: "03", name: "Shirt", note: "Cut to your shoulder and sleeve measurements" },
  { no: "04", name: "Trousers", note: "Bootcut, straight or slim, as you prefer" },
];

export default function Garments() {
  return (
    <section className="section" id="garments" aria-labelledby="garments-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="garments-h">What we make</h2>
        </div>
        <ul className="garment-list">
          {ITEMS.map((item) => (
            <li key={item.no} className="garment-card">
              <span className="garment-card__no">{item.no}</span>
              <h3>{item.name}</h3>
              <p>{item.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
