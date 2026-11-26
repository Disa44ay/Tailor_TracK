import { useEffect, useState } from "react";
import { listEnquiries, getEnquiry, markEnquirySeen, sendCustomerMessage } from "../../api/booking.js";

const STATUS = {
  sent: { label: "Waiting for the studio", next: "The studio reviews each request and replies here. A red dot appears when they do." },
  in_conversation: { label: "In conversation", next: "The studio has replied. Read the message, then ask for a new date if you need one." },
  confirmed: { label: "Confirmed", next: "Your consultation is booked. Ask for a different date below if you need to move it." },
  closed: { label: "Closed", next: "This enquiry is closed. Book a new consultation to start again." },
};

const fmt = (value) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Blue dot: enquiry sent, nothing back yet. Red dot: the studio wrote back and you have not seen it.
export function dotFor(enquiry) {
  if (enquiry.unread) return "red";
  if (enquiry.status === "sent") return "blue";
  return null;
}

export function Dot({ color }) {
  if (!color) return null;
  return (
    <span
      className={`inquiry-dot inquiry-dot--${color}`}
      role="img"
      aria-label={color === "red" ? "New reply from the studio" : "Waiting for the studio"}
    />
  );
}

export default function InquiriesPanel({ onBook }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setError("");
    try {
      setList(await listEnquiries());
    } catch {
      setError("We could not load your inquiries. Check your connection and try again.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function openEnquiry(id) {
    setNotice("");
    setOpen(await getEnquiry(id));
    await markEnquirySeen(id).catch(() => {});
    refresh();
  }

  async function changeDate(proposedAt) {
    await sendCustomerMessage(open.id, { kind: "date_request", proposed_at: proposedAt });
    setOpen(await getEnquiry(open.id));
    setNotice("Request sent. The studio will confirm the date or reply here.");
  }

  if (open) {
    const requested = [...open.messages].reverse().find((m) => m.kind === "date_request");
    const garments = open.items.map((i) => cap(i.garment)).join(", ");
    return (
      <section className="inquiry" aria-labelledby="inquiry-title">
        <button type="button" className="inquiry__back" onClick={() => setOpen(null)}>
          All inquiries
        </button>
        <h2 id="inquiry-title" className="inquiry__title">{garments}</h2>
        <p className="inquiry__meta">Enquiry #{open.id}, sent {fmt(open.created_at)}</p>

        <div className="inquiry__status-card">
          <p className="inquiry__status">{STATUS[open.status]?.label ?? open.status}</p>
          <p>{STATUS[open.status]?.next}</p>
        </div>

        <dl className="inquiry__facts">
          <dt>Requested date</dt>
          <dd>{requested ? fmt(requested.proposed_at) : "Not set yet"}</dd>
          {open.status === "confirmed" && (
            <>
              <dt>Consultation</dt>
              <dd>{fmt(open.consultation_at)}</dd>
            </>
          )}
        </dl>

        <h3 className="inquiry__heading">Garments</h3>
        <ul className="inquiry__items">
          {open.items.map((i) => (
            <li key={i.id}>
              {cap(i.garment)}: {i.fabric_type}, {i.fabric_colour}
            </li>
          ))}
        </ul>

        <h3 className="inquiry__heading">Messages</h3>
        {open.messages.length === 0 ? (
          <p className="inquiry__empty">No messages yet. The studio replies here.</p>
        ) : (
          <ol className="inquiry__messages">
            {open.messages.map((m) => (
              <li key={m.id}>
                <strong>{m.sender === "admin" ? "Studio" : "You"}</strong>
                <time dateTime={m.created_at}>{fmt(m.created_at)}</time>
                <span>
                  {m.kind === "message" && m.body}
                  {m.kind === "date_request" && `Asked for ${fmt(m.proposed_at)}`}
                  {m.kind === "date_confirmed" && `Consultation confirmed for ${fmt(m.proposed_at)}`}
                </span>
              </li>
            ))}
          </ol>
        )}

        {open.status !== "closed" && (
          <ChangeDate onSend={changeDate} />
        )}
        {notice && <p role="status" className="inquiry__notice">{notice}</p>}
      </section>
    );
  }

  return (
    <section className="inquiry" aria-labelledby="inquiry-title">
      <h2 id="inquiry-title" className="inquiry__title">My inquiries</h2>
      <p className="inquiry__legend">
        <Dot color="blue" /> Waiting for the studio <Dot color="red" /> New reply
      </p>

      {error && (
        <div role="alert" className="inquiry__error">
          <p>{error}</p>
          <button type="button" className="btn" onClick={refresh}>Try again</button>
        </div>
      )}
      {!error && list === null && <p role="status" className="inquiry__empty">Loading your inquiries…</p>}
      {list?.length === 0 && (
        <div className="inquiry__empty-state">
          <p>You have no enquiries yet. Tell the studio what you want made and when you can visit.</p>
          {onBook && <button type="button" className="btn btn--primary" onClick={onBook}>Book a consultation</button>}
        </div>
      )}

      <ul className="inquiry__list">
        {list?.map((e) => {
          const requested = e.requested_at ? fmt(e.requested_at) : "No date requested";
          return (
            <li key={e.id}>
              <button type="button" className="inquiry__row" onClick={() => openEnquiry(e.id)}>
                <Dot color={dotFor(e)} />
                <span className="inquiry__row-text">
                  <span className="inquiry__row-title">{cap(e.garments ?? "Enquiry")}</span>
                  <span className="inquiry__row-meta">{STATUS[e.status]?.label ?? e.status}</span>
                  <span className="inquiry__row-meta">{requested}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ChangeDate({ onSend }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="inquiry__reply"
      onSubmit={(e) => {
        e.preventDefault();
        onSend(value);
        setValue("");
      }}
    >
      <h3 className="inquiry__heading">Ask for a different date</h3>
      <p className="inquiry__help">Pick a new date and time. The studio will confirm it or send you a note.</p>
      <label className="inquiry__label">
        New date and time
        <input type="datetime-local" required value={value} onChange={(e) => setValue(e.target.value)} className="booking-glass" />
      </label>
      <button type="submit" className="btn btn--primary">Send request</button>
    </form>
  );
}
