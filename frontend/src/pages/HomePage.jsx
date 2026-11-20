import { useState } from "react";
import HomeNav from "../components/home/HomeNav.jsx";
import Hero from "../components/home/Hero.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import AuthModal from "../components/home/AuthModal.jsx";

// Public marketing homepage: nav + hero + how-it-works on the paper background.
// "Let's go" and "Log in" both open the same auth modal instead of navigating
// to a separate page.
function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="bg-paper">
      <HomeNav onLogin={() => setAuthOpen(true)} />
      <Hero onLetsGo={() => setAuthOpen(true)} />
      <HowItWorks />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default HomePage;
