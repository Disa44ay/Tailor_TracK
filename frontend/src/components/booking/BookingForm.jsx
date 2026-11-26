import { useEffect, useState } from "react";
import { createEnquiry, getProfile, sendCustomerMessage } from "../../api/booking.js";
import { FABRIC_TYPES, FABRIC_COLOURS } from "./fabricOptions.js";

export const GARMENTS = [
  { value: "shirt", label: "Shirt" },
  { value: "pant", label: "Pant" },
  { value: "pajama", label: "Paijama" },
  { value: "suit", label: "Suit" },
];

const EMPTY_ITEM = { garment: "shirt", fabricType: "", fabricColour: "" };

// Measurements are stored on the profile and pre-filled; the enquiry keeps its own copy.
export default function BookingForm({ onSubmitted }) {
  const [body, setBody] = useState({ height_cm: "", weight_kg: "", age: "" });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [preferred, setPreferred] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((p) => {
        if (cancelled) return;
        setBody({
          height_cm: p.height_cm ?? "",
          weight_kg: p.weight_kg ?? "",
          age: p.age ?? "",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function setField(field) {
    return (e) => setBody((b) => ({ ...b, [field]: e.target.value }));
  }

  function setItem(index, field, value) {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function removeItem(index) {
    setItems((list) => list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((it) => ({
          garment: it.garment,
          fabricType: it.fabricType,
          fabricColour: it.fabricColour,
        })),
        height_cm: Number(body.height_cm),
        weight_kg: Number(body.weight_kg),
        age: Number(body.age),
      };
      const created = await createEnquiry(payload);
      await sendCustomerMessage(created.enquiry.id, { kind: "date_request", proposed_at: preferred });
      onSubmitted?.(created);
    } catch (err) {
      setError(err.message || "Could not send your enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="booking-form" aria-label="Book a consultation">
      <h2 className="booking-form__title">Book a consultation</h2>

      <label className="booking-form__label">
        Preferred date and time
        <input type="datetime-local" required value={preferred} onChange={(e) => setPreferred(e.target.value)} className="booking-glass" />
      </label>

      <fieldset className="booking-form__body">
        <legend className="booking-form__legend">Your measurements</legend>
        <label className="booking-form__label">
          Height (cm)
          <input type="number" min="50" max="250" required value={body.height_cm} onChange={setField("height_cm")} className="booking-glass" />
        </label>
        <label className="booking-form__label">
          Weight (kg)
          <input type="number" min="20" max="300" required value={body.weight_kg} onChange={setField("weight_kg")} className="booking-glass" />
        </label>
        <label className="booking-form__label">
          Age
          <input type="number" min="1" max="120" required value={body.age} onChange={setField("age")} className="booking-glass" />
        </label>
      </fieldset>

      {items.map((item, index) => (
        <fieldset key={index} className="booking-form__item">
          <legend className="booking-form__legend">Garment {index + 1}</legend>
          <label className="booking-form__label">
            What you want
            <select value={item.garment} onChange={(e) => setItem(index, "garment", e.target.value)} className="booking-glass">
              {GARMENTS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="booking-form__label">
            Fabric type
            <select required value={item.fabricType} onChange={(e) => setItem(index, "fabricType", e.target.value)} className="booking-glass">
              <option value="" disabled>Choose a fabric</option>
              {FABRIC_TYPES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="booking-form__label">
            Fabric colour
            <select required value={item.fabricColour} onChange={(e) => setItem(index, "fabricColour", e.target.value)} className="booking-glass">
              <option value="" disabled>Choose a colour</option>
              {FABRIC_COLOURS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
                    {items.length > 1 && (
            <button type="button" className="booking-form__remove" onClick={() => removeItem(index)}>
              Remove garment {index + 1}
            </button>
          )}
        </fieldset>
      ))}

      <button type="button" className="booking-form__add" onClick={() => setItems((l) => [...l, { ...EMPTY_ITEM }])}>
        Add another
      </button>

      {error && (
        <p role="alert" className="booking-form__error">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn btn--primary">
        Send enquiry
      </button>
    </form>
  );
}
