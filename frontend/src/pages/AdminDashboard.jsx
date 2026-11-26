import { useEffect, useState } from "react";
import {
  adminCustomers,
  adminEnquiries,
  adminEnquiry,
  adminSendMessage,
  adminConfirm,
  adminStats,
} from "../api/booking.js";

const PAGE = 5;
const MORE = 10;

// One screen. Each list shows PAGE rows; "See more" adds rows inside its own panel,
// which scrolls. The page itself never grows.
export default function AdminDashboard() {
  const [customers, setCustomers] = useState([]);
  const [pending, setPending] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [stats, setStats] = useState({ byGarment: [], byFabric: [] });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [c, sent, talking, cf, s] = await Promise.all([
        adminCustomers(),
        adminEnquiries("sent"),
        adminEnquiries("in_conversation"),
        adminEnquiries("confirmed"),
        adminStats(),
      ]);
      setCustomers(c);
      setPending([...sent, ...talking].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
      setConfirmed(cf);
      setStats(s);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function openEnquiry(id) {
    setSelected(await adminEnquiry(id));
  }

  async function reload(id) {
    setSelected(await adminEnquiry(id));
    refresh();
  }

  async function accept(date) {
    await adminConfirm(selected.id, date);
    await reload(selected.id);
  }

  async function sendNote(text) {
    await adminSendMessage(selected.id, { kind: "message", body: text });
    await reload(selected.id);
  }

  const requested = selected
    ? [...selected.messages].reverse().find((m) => m.kind === "date_request")
    : null;
  const kpis = [
    { label: "Customers", value: customers.length },
    { label: "Awaiting reply", value: pending.length, alert: pending.length > 0 },
    { label: "Confirmed", value: confirmed.length },
    { label: "Garments booked", value: stats.byGarment.reduce((n, r) => n + r.count, 0) },
  ];

  return (
    <main className="admin">
      <header className="admin__top">
        <h1 className="admin__title">Consultations</h1>
        <span className="admin__stamp">Studio admin</span>
      </header>

      {error && <p role="alert" className="admin__empty">{error}</p>}

      <div className="admin__kpis" role="group" aria-label="Summary">
        {kpis.map((k) => (
          <div key={k.label} className={`admin__kpi${k.alert ? " admin__kpi--alert" : ""}`}>
            <span className="admin__kpi-label">{k.label}</span>
            <span className="admin__kpi-value">{k.value}</span>
          </div>
        ))}
      </div>

      <div className="admin__work">
        <Panel title="Pending consultations" className="admin__queue">
          <ExpandableList
            items={pending}
            empty="Nothing waiting."
            render={(e) => (
              <button
                type="button"
                className={`admin__row${selected?.id === e.id ? " is-active" : ""}`}
                onClick={() => openEnquiry(e.id)}
              >
                <span>#{e.id}</span>
                <span>{e.customer_name}</span>
                <span className="admin__status">{e.status === "sent" ? "New" : "In talks"}</span>
              </button>
            )}
          />
        </Panel>

        <Panel title={selected ? `Enquiry #${selected.id}` : "Enquiry"} className="admin__detail">
          {!selected && <p className="admin__empty">Select an enquiry to review it.</p>}
          {selected && (
            <div className="admin__scroll">
              <p className="admin__meta">
                {selected.height_cm} cm, {selected.weight_kg} kg, age {selected.age}
              </p>
              <ul className="admin__rows">
                {selected.items.map((it) => (
                  <li key={it.id} className="admin__item">
                    {it.garment}: {it.fabric_type}, {it.fabric_colour}
                  </li>
                ))}
              </ul>

              {selected.status === "confirmed" ? (
                <p className="admin__meta">
                  Confirmed for {new Date(selected.consultation_at).toLocaleString()}.
                </p>
              ) : (
                <div className="admin__actions">
                  <p className="admin__meta">
                    {requested
                      ? `Requested: ${new Date(requested.proposed_at).toLocaleString()}`
                      : "No date requested yet."}
                  </p>
                  <button
                    type="button"
                    className="admin__button"
                    disabled={!requested}
                    onClick={() => accept(requested.proposed_at)}
                  >
                    Accept this date
                  </button>
                  <NoteForm onSend={sendNote} />
                </div>
              )}

              <h3 className="admin__h3">Conversation</h3>
              <ol className="admin__thread">
                {selected.messages.map((m) => (
                  <li key={m.id}>
                    <strong>{m.sender === "admin" ? "Studio" : "Customer"}</strong>{" "}
                    {m.kind === "message" && m.body}
                    {m.kind === "date_request" && `asked for ${new Date(m.proposed_at).toLocaleString()}`}
                    {m.kind === "date_confirmed" && `confirmed ${new Date(m.proposed_at).toLocaleString()}`}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Panel>
      </div>

      <div className="admin__work admin__work--bottom">
        <Panel title="Confirmed consultations" className="admin__confirmed">
          <ExpandableList
            items={confirmed}
            empty="None yet."
            render={(e) => (
              <div className="admin__row admin__row--static">
                <span>#{e.id}</span>
                <span>{e.customer_name}</span>
                <span>{e.consultation_at && new Date(e.consultation_at).toLocaleString()}</span>
              </div>
            )}
          />
        </Panel>

        <Panel title="All customers" className="admin__customers">
          <ExpandableList
            items={customers}
            empty="No customers yet."
            render={(c) => (
              <div className="admin__row admin__row--static">
                <span>{c.name}</span>
                <span>{c.email}</span>
              </div>
            )}
          />
        </Panel>

        <Panel title="Trends" className="admin__trends">
          <h3 className="admin__h3">Most demanded garment</h3>
          <Bars rows={stats.byGarment} />
          <h3 className="admin__h3">Most demanded fabric</h3>
          <Bars rows={stats.byFabric} />
        </Panel>
      </div>
    </main>
  );
}

function Panel({ title, className, children }) {
  return (
    <section className={`admin__panel ${className}`} aria-label={title}>
      <h2 className="admin__h2">{title}</h2>
      <div className="admin__body">{children}</div>
    </section>
  );
}

// Shows PAGE rows; "See more" adds MORE rows. The list scrolls inside its panel.
function ExpandableList({ items, render, empty }) {
  const [shown, setShown] = useState(PAGE);
  if (items.length === 0) return <p className="admin__empty">{empty}</p>;
  return (
    <>
      <ul className="admin__rows">
        {items.slice(0, shown).map((item, i) => (
          <li key={item.id ?? item.email ?? i}>{render(item)}</li>
        ))}
      </ul>
      {shown < items.length && (
        <button type="button" className="admin__more" onClick={() => setShown((n) => n + MORE)}>
          See more
        </button>
      )}
    </>
  );
}

function Bars({ rows }) {
  if (rows.length === 0) return <p className="admin__empty">No bookings yet.</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="admin__bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <span className="admin__bar-track">
            <span className="admin__bar" style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className="admin__bar-count">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

function NoteForm({ onSend }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="admin__form"
      onSubmit={(e) => {
        e.preventDefault();
        onSend(value);
        setValue("");
      }}
    >
      <label className="admin__label">
        Send a note to the customer
        <input required value={value} onChange={(e) => setValue(e.target.value)} className="admin__input" />
      </label>
      <button type="submit" className="admin__button admin__button--ghost">Send note</button>
    </form>
  );
}
