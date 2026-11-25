import { useState } from "react";
import HomeNav from "../components/home/HomeNav.jsx";
import Hero from "../components/home/Hero.jsx";
import FitStatement from "../components/home/FitStatement.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import Footer from "../components/home/Footer.jsx";
import AuthModal from "../components/home/AuthModal.jsx";

// Public marketing homepage: nav + hero + how-it-works on the paper background.
// "Let's go" and "Log in" both open the same auth modal instead of navigating
// to a separate page.
function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <HomeNav onLogin={() => setAuthOpen(true)} />
      <main id="top">
        <Hero onLetsGo={() => setAuthOpen(true)} />
        <FitStatement />
        <HowItWorks />
      </main>
      <Footer onBookConsultation={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default HomePage;
