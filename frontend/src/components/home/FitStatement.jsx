import { useLayoutEffect, useRef } from "react";

export default function FitStatement() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    window.__mountMoment?.(sectionRef.current);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section statement"
      id="fit"
      data-moment="word-highlight"
      aria-label="On fit"
    >
      <div className="wrap">
        <p className="mo-wh__text">
          We measure you twice: with a tape, then by eye, watching how the fabric
          sits as you move, until the <strong>fit</strong> feels natural.
        </p>
      </div>
    </section>
  );
}
