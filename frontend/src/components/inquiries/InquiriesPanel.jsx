import { useEffect, useState } from "react";
import { listEnquiries, getEnquiry, markEnquirySeen, sendCustomerMessage } from "../../api/booking.js";

const STATUS_LABEL = {
  sent: "Sent, waiting for the studio",
  in_conversation: "In talks with the studio",
  confirmed: "Confirmed",
  closed: "Closed",
};

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
      aria-label={color === "red" ? "New reply from the studio" : "Enquiry sent"}
    />
  );
}

// The customer's view is simple: see the status, read the studio's note, change the date.
export default function InquiriesPanel() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setList(await listEnquiries());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function openEnquiry(id) {
    setOpen(await getEnquiry(id));
    await markEnquirySeen(id).catch(() => {});
    refresh();
  }

  async function changeDate(proposedAt) {
    await sendCustomerMessage(open.id, { kind: "date_request", proposed_at: proposedAt });
    setOpen(await getEnquiry(open.id));
    refresh();
  }

  if (open) {
    return (
      <section className="inquiry" aria-label="Inquiry">
        <button type="button" className="inquiry__back" onClick={() => setOpen(null)}>
          Back to my inquiries
        </button>
        <h3 className="inquiry__title">Enquiry #{open.id}</h3>
        <p className="inquiry__status">{STATUS_LABEL[open.status] ?? open.status}</p>
        {open.status === "confirmed" && (
          <p className="inquiry__status">
            Consultation: {new Date(open.consultation_at).toLocaleString()}
          </p>
        )}
        <ol className="inquiry__messages">
          {(open.messages || []).map((m) => (
            <li key={m.id}>
              <strong>{m.sender === "admin" ? "Studio" : "You"}</strong>{" "}
              {m.kind === "message" && m.body}
              {m.kind === "date_request" && `asked for ${new Date(m.proposed_at).toLocaleString()}`}
              {m.kind === "date_confirmed" && `confirmed ${new Date(m.proposed_at).toLocaleString()}`}
            </li>
          ))}
        </ol>
        {open.status !== "confirmed" && <ChangeDate onSend={changeDate} />}
      </section>
    );
  }

  return (
    <section className="inquiry" aria-label="My inquiries">
      <h2 className="inquiry__title">My inquiries</h2>
      {error && <p role="alert">{error}</p>}
      {list.length === 0 && <p>No enquiries yet.</p>}
      <ul className="inquiry__list">
        {list.map((e) => (
          <li key={e.id}>
            <button type="button" className="inquiry__row" onClick={() => openEnquiry(e.id)}>
              <Dot color={dotFor(e)} />
              Enquiry #{e.id}, {STATUS_LABEL[e.status] ?? e.status}
            </button>
          </li>
        ))}
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
      <label>
        Change the date
        <input
          type="datetime-local"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="booking-glass"
        />
      </label>
      <button type="submit" className="btn btn--primary">
        Send new date
      </button>
    </form>
  );
}
