export default function Approaches() {
  return (
    <section className="section ground-inverse approaches" id="approaches" aria-labelledby="approaches-h">
      <div className="wrap grid grid--middle">
        <div className="span-7">
          <div className="section-head">
            <h2 id="approaches-h">Two ways to start</h2>
          </div>
          <ol className="approach-list">
            <li className="approach-item">
              <span className="approach-item__no">01</span>
              <div>
                <h3>Made to measure</h3>
                <p>
                  We start from your nearest pattern and adjust it on you, in person, until it fits.
                  The usual start for a first order.
                </p>
              </div>
            </li>
            <li className="approach-item">
              <span className="approach-item__no">02</span>
              <div>
                <h3>Bespoke</h3>
                <p>
                  A pattern cut from your measurements alone, built fitting by fitting, with no
                  compromises.
                </p>
              </div>
            </li>
          </ol>
        </div>
        <div className="frame frame--photo frame--portrait span-5 start-8">
          <img
            className="frame__img"
            src="/assets/photos/approaches-fabric-swatches.jpg"
            alt="Wool suit-fabric swatches fanned out on a tailor's table"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
