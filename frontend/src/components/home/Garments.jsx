import { useLanguage } from "../../app/LanguageContext.jsx";

const COPY = {
  bn: {
    heading: "আমরা যা তৈরি করি",
    items: [
      { no: "০১", name: "স্যুট", note: "দুই বা তিন বোতাম, ব্যবসায়িক বা উৎসবের জন্য" },
      { no: "০২", name: "পাঞ্জাবি", note: "নকশা করা বা সাদামাটা, উৎসব ও বিশেষ অনুষ্ঠানের জন্য" },
      { no: "০৩", name: "শার্ট", note: "আপনার কাঁধ ও হাতের মাপে তৈরি" },
      { no: "০৪", name: "ট্রাউজার", note: "বুট-কাট, সোজা বা স্লিম, আপনার পছন্দমতো" },
    ],
  },
  en: {
    heading: "What we make",
    items: [
      { no: "01", name: "Suit", note: "Two or three buttons, for work or occasions" },
      { no: "02", name: "Panjabi", note: "Plain or embroidered, for festivals and events" },
      { no: "03", name: "Shirt", note: "Cut to your shoulder and sleeve measurements" },
      { no: "04", name: "Trousers", note: "Bootcut, straight or slim, as you prefer" },
    ],
  },
};

export default function Garments() {
  const { lang } = useLanguage();
  const t = COPY[lang];

  return (
    <section className="section" id="garments" aria-labelledby="garments-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="garments-h">{t.heading}</h2>
        </div>
        <ul className="grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {t.items.map((item) => (
            <li key={item.no} className="card span-3">
              <p className="t-label">{item.no}</p>
              <h3>{item.name}</h3>
              <p>{item.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
