import { Navigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext.jsx";

// Routes with role "admin" check the studio session; everything else checks the customer session.
function ProtectedRoute({ children, role }) {
  const auth = useAuth();
  const studio = role === "admin";
  const token = studio ? auth.adminToken : auth.token;
  const user = studio ? auth.adminUser : auth.user;

  if (!token) return <Navigate to={studio ? "/admin/login" : "/"} replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
