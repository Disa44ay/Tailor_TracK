import HomePage from "./HomePage.jsx";

// Public landing route. Role-based post-login redirects will return once
// this branch's authenticated pages exist again.
function Home() {
  return <HomePage />;
}

export default Home;
