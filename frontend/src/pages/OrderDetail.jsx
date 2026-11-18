import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";

const GARMENT_TYPES = ["shirt", "pant", "panjabi", "suit_2pc", "suit_3pc", "kurta", "blouse", "other"];
const PRIORITIES = ["normal", "fast", "urgent"];

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState({ garmentType: "", styleNotes: "", fabricNote: "", priority: "normal" });

  function load() {
    return apiFetch(`/orders/${id}`).then((data) => {
      setOrder(data);
      setEdit({
        garmentType: data.garment_type,
        styleNotes: data.style_notes || "",
        fabricNote: data.fabric_note || "",
        priority: data.priority || "normal",
      });
    });
  }

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm() {
    setBusy(true);
    try {
      const { gatewayUrl } = await apiFetch(`/orders/${id}/confirm`, { method: "POST" });
      window.location.assign(gatewayUrl);
    } catch {
      setBusy(false);
    }
  }

  async function handleDecline() {
    setBusy(true);
    try {
      await apiFetch(`/orders/${id}/decline`, { method: "POST" });
      await load();
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setBusy(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(edit) });
      await load();
    } catch {
      // apiFetch already surfaced a toast
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="p-8 text-slate-500">Loading…</main>;
  if (!order) return null;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <button onClick={() => navigate("/orders")} className="text-sm text-slate-500 underline">
        ← My orders
      </button>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          #{order.id} — {order.garment_type.replace(/_/g, " ")}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.quoted_price != null && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900">Invoice</h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-700">
            <div className="flex justify-between">
              <dt>Due date</dt>
              <dd>{order.due_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Total price</dt>
              <dd>৳{order.quoted_price}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Advance due now</dt>
              <dd>৳{order.advance_required}</dd>
            </div>
          </dl>
          {order.status === "quoted" && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Confirm
              </button>
              <button
                onClick={handleDecline}
                disabled={busy}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      )}

      {order.status === "needs_changes" && (
        <form onSubmit={handleEditSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900">Edit and resubmit</h2>

          <div>
            <label htmlFor="garmentType" className="block text-sm font-medium text-slate-700">
              Garment type
            </label>
            <select
              id="garmentType"
              value={edit.garmentType}
              onChange={(e) => setEdit((f) => ({ ...f, garmentType: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {GARMENT_TYPES.map((g) => (
                <option key={g} value={g}>
                  {g.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fabricNote" className="block text-sm font-medium text-slate-700">
              Fabric note
            </label>
            <input
              id="fabricNote"
              value={edit.fabricNote}
              onChange={(e) => setEdit((f) => ({ ...f, fabricNote: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="styleNotes" className="block text-sm font-medium text-slate-700">
              Style notes
            </label>
            <textarea
              id="styleNotes"
              required={edit.garmentType === "other"}
              value={edit.styleNotes}
              onChange={(e) => setEdit((f) => ({ ...f, styleNotes: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-slate-700">Priority</legend>
            <div className="mt-1 flex gap-4">
              {PRIORITIES.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={edit.priority === p}
                    onChange={(e) => setEdit((f) => ({ ...f, priority: e.target.value }))}
                  />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Save
          </button>
        </form>
      )}

      {order.status !== "quoted" && order.status !== "needs_changes" && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
          {order.style_notes && <p>Style notes: {order.style_notes}</p>}
          {order.fabric_note && <p className="mt-1">Fabric: {order.fabric_note}</p>}
        </div>
      )}
    </main>
  );
}

export default OrderDetail;
