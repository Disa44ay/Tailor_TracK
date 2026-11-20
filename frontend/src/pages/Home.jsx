import { Navigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext.jsx";
import HomePage from "./HomePage.jsx";

// Public landing route: shows the marketing homepage when logged out,
// or redirects by role when logged in. The admin side arrives in Task 13.
function Home() {
  const { user, token } = useAuth();
  if (!token) return <HomePage />;
  if (user?.role === "admin") return <Navigate to="/admin/orders" replace />;
  return <Navigate to="/orders" replace />;
}

export default Home;
