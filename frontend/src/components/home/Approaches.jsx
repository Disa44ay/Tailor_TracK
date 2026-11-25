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
                  We start from your closest pattern and adjust it against you in person until it reads
                  as made for you. The usual starting point for a first order.
                </p>
              </div>
            </li>
            <li className="approach-item">
              <span className="approach-item__no">02</span>
              <div>
                <h3>Bespoke</h3>
                <p>
                  A pattern cut from nothing but your own measurements, built fitting by fitting. For a
                  piece with no compromise in it anywhere.
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
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
