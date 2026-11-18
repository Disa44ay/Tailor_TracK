import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";

const NEXT_STAGE = {
  confirmed: "cutting",
  cutting: "stitching",
  stitching: "ready",
  ready: "completed",
};

function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [advanceRequired, setAdvanceRequired] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // No GET /admin/orders/:id exists on the backend (only the filtered list
  // and GET /orders/:id, which is customer-scoped and 404s for an admin) —
  // fetch the list and find this one. See the ledger for this task.
  function load() {
    return apiFetch("/admin/orders").then((orders) => {
      const found = orders.find((o) => String(o.id) === String(id));
      setOrder(found ?? null);
      return found;
    });
  }

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReject(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/admin/orders/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) });
      setReason("");
      await load();
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setBusy(false);
    }
  }

  async function handleQuote(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/admin/orders/${id}/quote`, {
        method: "PATCH",
        body: JSON.stringify({
          dueDate,
          quotedPrice: Number(quotedPrice),
          advanceRequired: Number(advanceRequired),
        }),
      });
      await load();
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setBusy(false);
    }
  }

  async function handleAdvanceStage() {
    setBusy(true);
    try {
      await apiFetch(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ toStatus: NEXT_STAGE[order.status] }),
      });
      await load();
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/admin/orders/${id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      setAmount("");
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setBusy(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/admin/notifications", {
        method: "POST",
        body: JSON.stringify({ customerId: order.customer_id, message, orderId: order.id }),
      });
      setMessage("");
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="p-8 text-slate-500">Loading…</main>;
  if (!order) return null;

  const nextStage = NEXT_STAGE[order.status];

  return (
    <main className="mx-auto max-w-2xl p-8">
      <button onClick={() => navigate("/admin/orders")} className="text-sm text-slate-500 underline">
        ← Order board
      </button>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          #{order.id} — {order.garment_type.replace(/_/g, " ")}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
        <dt className="text-slate-500">Priority</dt>
        <dd className="capitalize">{order.priority}</dd>
        <dt className="text-slate-500">Fabric note</dt>
        <dd>{order.fabric_note || "—"}</dd>
        <dt className="text-slate-500">Style notes</dt>
        <dd className="col-span-2">{order.style_notes || "—"}</dd>
      </dl>

      {order.measurements_snapshot && (
        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900">Measurements</h2>
          <dl className="mt-2 grid grid-cols-4 gap-2 text-sm text-slate-700">
            {Object.entries(order.measurements_snapshot)
              .filter(([key, value]) => key !== "customer_id" && value != null)
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-slate-500 capitalize">{key.replace(/_/g, " ")}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}

      {order.status === "requested" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleReject} className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-medium text-slate-900">Reject</h2>
            <label htmlFor="reason" className="mt-2 block text-sm font-medium text-slate-700">
              Reason
            </label>
            <textarea
              id="reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-3 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              Reject
            </button>
          </form>

          <form onSubmit={handleQuote} className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-medium text-slate-900">Quote</h2>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">
                  Due date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="quotedPrice" className="block text-sm font-medium text-slate-700">
                  Quoted price
                </label>
                <input
                  id="quotedPrice"
                  type="number"
                  required
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="advanceRequired" className="block text-sm font-medium text-slate-700">
                  Advance required
                </label>
                <input
                  id="advanceRequired"
                  type="number"
                  required
                  value={advanceRequired}
                  onChange={(e) => setAdvanceRequired(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Send quote
            </button>
          </form>
        </div>
      )}

      {order.status === "quoted" && (
        <p className="mt-6 text-sm text-slate-500">Waiting on the customer to confirm or decline.</p>
      )}

      {nextStage && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900">Production</h2>
          <button
            onClick={handleAdvanceStage}
            disabled={busy}
            className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white capitalize disabled:opacity-60"
          >
            {nextStage}
          </button>
        </div>
      )}

      <form onSubmit={handleRecordPayment} className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-medium text-slate-900">Record balance payment</h2>
        <label htmlFor="amount" className="mt-2 block text-sm font-medium text-slate-700">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
        >
          Record payment
        </button>
      </form>

      <form onSubmit={handleSendMessage} className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-medium text-slate-900">Send a message to the customer</h2>
        <label htmlFor="message" className="mt-2 block text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
        >
          Send message
        </button>
      </form>
    </main>
  );
}

export default AdminOrderDetail;
