import { Navigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext.jsx";

function ProtectedRoute({ children, role }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
