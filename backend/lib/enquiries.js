import { pool } from "../db/pool.js";

export const GARMENTS = ["shirt", "pant", "pajama", "suit"];
export const ENQUIRY_STATUSES = ["sent", "in_conversation", "confirmed", "closed"];

const INT4_MAX = 2147483647;

// Returns the id as a number, or null for anything that cannot be a row id.
// Anything else would reach Postgres and come back as a 500.
export function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 && id <= INT4_MAX ? id : null;
}

// Returns an error message, or null when the value is a parseable date string.
export function checkDate(value, field) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return `${field} must be a valid date`;
  }
  return null;
}

const ENQUIRY_SELECT = `
  SELECT id, user_id, status, consultation_at, customer_last_seen_at, admin_last_seen_at,
         created_at, updated_at,
         height_cm::double precision AS height_cm,
         weight_kg::double precision AS weight_kg,
         age
  FROM enquiries`;

// Full detail for one enquiry. Pass a userId to limit it to that customer's enquiries;
// omit it for the admin view. Returns null when nothing matches.
export async function loadEnquiryDetail(id, userId = null, db = pool) {
  const enquiry = await db.query(
    `${ENQUIRY_SELECT} WHERE id = $1 AND ($2::int IS NULL OR user_id = $2)`,
    [id, userId]
  );
  if (enquiry.rows.length === 0) return null;

  const items = await db.query(
    `SELECT id, garment, fabric_type, fabric_colour
     FROM enquiry_items WHERE enquiry_id = $1 ORDER BY id`,
    [id]
  );
  const messages = await db.query(
    `SELECT id, sender, kind, body, proposed_at, created_at
     FROM enquiry_messages WHERE enquiry_id = $1 ORDER BY created_at, id`,
    [id]
  );
  return { enquiry: enquiry.rows[0], items: items.rows, messages: messages.rows };
}

// Returns true when the enquiry exists (and belongs to userId, when given).
export async function enquiryExists(id, userId = null, db = pool) {
  const { rows } = await db.query(
    `SELECT id FROM enquiries WHERE id = $1 AND ($2::int IS NULL OR user_id = $2)`,
    [id, userId]
  );
  return rows.length > 0;
}

// Adds a conversation message and moves the enquiry to in_conversation.
// Returns the new message row.
export async function addMessage(db, { enquiryId, sender, kind, body = null, proposedAt = null }) {
  await db.query(
    `UPDATE enquiries SET status = 'in_conversation', updated_at = now() WHERE id = $1`,
    [enquiryId]
  );
  const { rows } = await db.query(
    `INSERT INTO enquiry_messages (enquiry_id, sender, kind, body, proposed_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, sender, kind, body, proposed_at, created_at`,
    [enquiryId, sender, kind, body, proposedAt]
  );
  return rows[0];
}

// Sets the date and status confirmed, and writes a date_confirmed message.
// Both the customer and the admin use this; sender says which one confirmed.
export async function confirmConsultation(db, { enquiryId, sender, consultationAt }) {
  await db.query(
    `UPDATE enquiries SET status = 'confirmed', consultation_at = $2, updated_at = now() WHERE id = $1`,
    [enquiryId, consultationAt]
  );
  await db.query(
    `INSERT INTO enquiry_messages (enquiry_id, sender, kind, proposed_at)
     VALUES ($1, $2, 'date_confirmed', $3)`,
    [enquiryId, sender, consultationAt]
  );
}
