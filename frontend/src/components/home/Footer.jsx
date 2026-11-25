import Logo from "../brand/Logo.jsx";

export default function Footer({ onBookConsultation }) {
  return (
    <footer className="footer closing" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--type">
          <div className="section-head">
            <h2 id="close-h">Book a consultation</h2>
          </div>
          <button type="button" className="btn btn--primary btn--xl" onClick={onBookConsultation}>
            Book a consultation
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </button>
        </div>

        <div className="closing__links">
          <div className="grid">
            <div className="span-6 stack-5">
              <a className="nav__logo" href="#top">
                <Logo className="text-[22px]" />
              </a>
              <p className="footer__lede">A custom clothing studio.</p>
            </div>
            <div className="span-6 start-7 footer__col">
              <h4>Contact</h4>
              <ul>
                <li>
                  <a href="mailto:hello@oboyob.example">Write to us</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>&copy; 2026 অবয়ব</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
