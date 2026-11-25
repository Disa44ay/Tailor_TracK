import { useState } from "react";
import HomeNav from "../components/home/HomeNav.jsx";
import Hero from "../components/home/Hero.jsx";
import FitStatement from "../components/home/FitStatement.jsx";
import Garments from "../components/home/Garments.jsx";
import Approaches from "../components/home/Approaches.jsx";
import Process from "../components/home/Process.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import Footer from "../components/home/Footer.jsx";
import AuthModal from "../components/home/AuthModal.jsx";

function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <HomeNav onLogin={() => setAuthOpen(true)} />
      <main id="top">
        <Hero onLetsGo={() => setAuthOpen(true)} />
        <FitStatement />
        <Garments />
        <Approaches />
        <Process />
        <HowItWorks />
      </main>
      <Footer onBookConsultation={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default HomePage;
