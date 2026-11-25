import { useLanguage } from "../../app/LanguageContext.jsx";

const COPY = {
  bn: {
    heading: "শুরু করার দুটি উপায়",
    items: [
      {
        no: "০১",
        title: "মাপ অনুযায়ী তৈরি",
        body: "আমরা আপনার কাছাকাছি একটি প্যাটার্ন দিয়ে শুরু করি এবং সরাসরি সাক্ষাতে তা আপনার সাথে মিলিয়ে সামঞ্জস্য করি। প্রথম অর্ডারের জন্য এটাই সাধারণ শুরু।",
      },
      {
        no: "০২",
        title: "বেসপোক",
        body: "শুধুমাত্র আপনার নিজের মাপ থেকে কাটা একটি প্যাটার্ন, ফিটিং ধরে ধরে তৈরি। এমন একটি পোশাকের জন্য যেখানে কোথাও কোনো আপস নেই।",
      },
    ],
    alt: "একজন দরজির টেবিলে পাখার মতো ছড়ানো উলের কাপড়ের নমুনা",
  },
  en: {
    heading: "Two ways to start",
    items: [
      {
        no: "01",
        title: "Made to measure",
        body: "We start from your closest pattern and adjust it against you in person until it reads as made for you. The usual starting point for a first order.",
      },
      {
        no: "02",
        title: "Bespoke",
        body: "A pattern cut from nothing but your own measurements, built fitting by fitting. For a piece with no compromise in it anywhere.",
      },
    ],
    alt: "Wool suit-fabric swatches fanned out on a tailor's table",
  },
};

export default function Approaches() {
  const { lang } = useLanguage();
  const t = COPY[lang];

  return (
    <section className="section ground-inverse" id="approaches" aria-labelledby="approaches-h">
      <div className="wrap grid grid--middle">
        <div className="span-7">
          <div className="section-head">
            <h2 id="approaches-h">{t.heading}</h2>
          </div>
          <ol className="stack-6" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {t.items.map((item) => (
              <li key={item.no}>
                <p className="t-label">{item.no}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="frame frame--photo frame--portrait span-5 start-8">
          <img className="frame__img" src="/assets/photos/approaches-fabric-swatches.jpg" alt={t.alt} loading="lazy" />
        </div>
      </div>
    </section>
  );
}
