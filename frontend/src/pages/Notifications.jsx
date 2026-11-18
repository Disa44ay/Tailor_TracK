import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/me/notifications")
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function markRead(n) {
    try {
      const updated = await apiFetch(`/me/notifications/${n.id}`, { method: "PATCH" });
      setNotifications((list) => list.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      // apiFetch already surfaced a toast
    }
  }

  if (loading) return <main className="p-8 text-slate-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Nothing yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => markRead(n)}
                className={`block w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                  n.is_read ? "text-slate-500" : "font-medium text-slate-900"
                }`}
              >
                {n.message}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default Notifications;
