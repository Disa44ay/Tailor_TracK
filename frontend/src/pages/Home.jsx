import { Navigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext.jsx";

// Public landing route: shows the marketing homepage when logged out,
// or redirects by role when logged in. The admin side arrives in Task 13.
function Home() {
  const { user, token } = useAuth();
  if (!token) return <div>homepage placeholder</div>;
  if (user?.role === "admin") return <Navigate to="/admin/orders" replace />;
  return <Navigate to="/orders" replace />;
}

export default Home;
