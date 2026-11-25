import { useLanguage } from "../../app/LanguageContext.jsx";

const COPY = {
  bn: {
    heading: "শুরু করার দুটি উপায়",
    measureTitle: "মাপ অনুযায়ী তৈরি",
    measureBody:
      "আমরা আপনার কাছাকাছি একটি প্যাটার্ন দিয়ে শুরু করি এবং সরাসরি সাক্ষাতে তা আপনার সাথে মিলিয়ে সামঞ্জস্য করি – ফিট, কাঁধ, ট্রাউজারের ব্রেক – যতক্ষণ না এটা পুরোপুরি আপনার জন্যই তৈরি মনে হয়। প্রথম অর্ডারের জন্য এটাই সাধারণ শুরু।",
    bespokeTitle: "বেসপোক",
    bespokeBody:
      "শুধুমাত্র আপনার নিজের মাপ থেকে কাটা একটি প্যাটার্ন, ফিটিং ধরে ধরে তৈরি। এমন একটি পোশাকের জন্য যেখানে কোথাও কোনো আপস নেই।",
  },
  en: {
    heading: "Two ways to start",
    measureTitle: "Made to measure",
    measureBody:
      "We start from your closest pattern and adjust it against you in person – the fit, the shoulder, the break of the trouser – until it reads as made for you. The usual starting point for a first order.",
    bespokeTitle: "Bespoke",
    bespokeBody:
      "A pattern cut from nothing but your own measurements, built fitting by fitting. For a piece with no compromise in it anywhere.",
  },
};

export default function Approaches() {
  const { lang } = useLanguage();
  const t = COPY[lang];

  return (
    <section className="section" id="approaches" aria-labelledby="approaches-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="approaches-h">{t.heading}</h2>
        </div>
        <div className="grid">
          <article className="card span-7">
            <h3>{t.measureTitle}</h3>
            <p>{t.measureBody}</p>
          </article>
          <article className="card span-5 start-8">
            <h3>{t.bespokeTitle}</h3>
            <p>{t.bespokeBody}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
