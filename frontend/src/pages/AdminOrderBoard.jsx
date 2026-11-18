import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";

const STATUSES = [
  "requested", "needs_changes", "quoted", "declined", "confirmed",
  "cutting", "stitching", "ready", "completed",
];

function AdminOrderBoard() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = status ? `?status=${status}` : "";
    apiFetch(`/admin/orders${query}`)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Order board</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No orders.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">
                  #{order.id} — {order.garment_type.replace(/_/g, " ")}
                </span>
                <OrderStatusBadge status={order.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default AdminOrderBoard;
