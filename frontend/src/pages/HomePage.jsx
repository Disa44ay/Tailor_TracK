import { useState } from "react";
import HomeNav from "../components/home/HomeNav.jsx";
import Hero from "../components/home/Hero.jsx";
import FitStatement from "../components/home/FitStatement.jsx";
import Approaches from "../components/home/Approaches.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import Footer from "../components/home/Footer.jsx";
import AuthModal from "../components/home/AuthModal.jsx";
import { useLanguage } from "../app/LanguageContext.jsx";

// Public marketing homepage: nav + hero + how-it-works on the paper background.
// "Let's go" and "Log in" both open the same auth modal instead of navigating
// to a separate page.
function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);
  const { lang } = useLanguage();

  return (
    <>
      <HomeNav onLogin={() => setAuthOpen(true)} />
      <main id="top">
        <Hero onLetsGo={() => setAuthOpen(true)} />
        {/* a lang-based key forces a clean remount so the moment/diagram widgets re-mount on fresh DOM */}
        <FitStatement key={`fit-${lang}`} />
        <Approaches />
        <HowItWorks key={`how-${lang}`} />
      </main>
      <Footer onBookConsultation={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default HomePage;
