import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/orders")
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="p-8 text-slate-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">My orders</h1>
        <Link to="/orders/new" className="text-sm font-medium text-slate-900 underline">
          New order
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No orders yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
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

export default MyOrders;
