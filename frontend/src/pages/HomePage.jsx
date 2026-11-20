import HomeNav from "../components/home/HomeNav.jsx";
import Hero from "../components/home/Hero.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";

// Public marketing homepage: nav + hero + how-it-works on the paper background.
function HomePage() {
  return (
    <div className="bg-paper">
      <HomeNav />
      <Hero />
      <HowItWorks />
    </div>
  );
}

export default HomePage;
