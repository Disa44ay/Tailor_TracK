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
          We take your measurements twice: once with a tape, once by eye, watching how the fabric
          sits on you as you move, until the <strong>fit</strong> looks like it was always there.
        </p>
      </div>
    </section>
  );
}
