import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext.jsx";

const CUSTOMER_LINKS = [
  ["/orders", "My orders"],
  ["/orders/new", "New order"],
  ["/measurements", "Measurements"],
  ["/notifications", "Notifications"],
];

const ADMIN_LINKS = [
  ["/admin/orders", "Order board"],
  ["/admin/reports", "Reports"],
  ["/notifications", "Notifications"],
];

function NavBar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!token) return null;

  const links = user?.role === "admin" ? ADMIN_LINKS : CUSTOMER_LINKS;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex gap-4">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="text-sm font-medium text-slate-700 hover:text-slate-900">
            {label}
          </Link>
        ))}
      </div>
      <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-slate-700">
        Log out
      </button>
    </nav>
  );
}

export default NavBar;
