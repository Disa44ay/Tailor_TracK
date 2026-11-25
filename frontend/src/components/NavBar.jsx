import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext.jsx";

function NavBar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  if (!token) return null;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <span className="text-sm font-semibold text-slate-900">TailorTrack</span>
      <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-slate-700">
        Log out
      </button>
    </nav>
  );
}

export default NavBar;
