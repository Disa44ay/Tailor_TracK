import { pool } from "../db/pool.js";
import { withTransaction } from "../lib/tx.js";
import { checkMeasurements } from "../lib/measurements.js";
import {
  GARMENTS,
  parseId,
  checkDate,
  loadEnquiryDetail,
  enquiryExists,
  addMessage,
  confirmConsultation,
} from "../lib/enquiries.js";

const nonEmpty = (value) => typeof value === "string" && value.trim() !== "";

function checkItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "items must be a non-empty list";
  for (const item of items) {
    if (!GARMENTS.includes(item.garment)) return `garment must be one of ${GARMENTS.join(", ")}`;
    if (!nonEmpty(item.fabricType)) return "fabricType is required";
    if (!nonEmpty(item.fabricColour)) return "fabricColour is required";
  }
  return null;
}

export async function createEnquiry(req, res) {
  // The studio account is not a customer; an enquiry from it would show as "Shop Admin" to the studio.
  if (req.user.role !== "customer") return res.status(403).json({ message: "Only customer accounts can send enquiries" });
  const { items, height_cm, weight_kg, age } = req.body;
  const error = checkItems(items) ?? checkMeasurements({ height_cm, weight_kg, age });
  if (error) return res.status(400).json({ message: error });

  const userId = req.user.id;
  const detail = await withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO enquiries (user_id, height_cm, weight_kg, age)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, height_cm ?? null, weight_kg ?? null, age ?? null]
    );
    const enquiryId = rows[0].id;

    for (const item of items) {
      await db.query(
        `INSERT INTO enquiry_items (enquiry_id, garment, fabric_type, fabric_colour)
         VALUES ($1, $2, $3, $4)`,
        [
          enquiryId,
          item.garment,
          item.fabricType.trim().toLowerCase(),
          item.fabricColour.trim().toLowerCase(),
        ]
      );
    }

    await db.query(
      `UPDATE users
       SET height_cm = COALESCE($1, height_cm),
           weight_kg = COALESCE($2, weight_kg),
           age = COALESCE($3, age)
       WHERE id = $4`,
      [height_cm ?? null, weight_kg ?? null, age ?? null, userId]
    );
    return loadEnquiryDetail(enquiryId, userId, db);
  });
  res.status(201).json(detail);
}

export async function listMyEnquiries(req, res) {
  // unread: the admin has written something newer than the customer last looked.
  const result = await pool.query(
    `SELECT e.id, e.status, e.consultation_at, e.created_at, e.updated_at,
            e.height_cm::double precision AS height_cm,
            e.weight_kg::double precision AS weight_kg,
            e.age,
            (SELECT string_agg(garment, ', ' ORDER BY id) FROM enquiry_items WHERE enquiry_id = e.id) AS garments,
            (SELECT proposed_at FROM enquiry_messages m
              WHERE m.enquiry_id = e.id AND m.kind = 'date_request'
              ORDER BY m.created_at DESC LIMIT 1) AS requested_at,
            EXISTS (
              SELECT 1 FROM enquiry_messages m
              WHERE m.enquiry_id = e.id AND m.sender = 'admin'
                AND m.created_at > COALESCE(e.customer_last_seen_at, '-infinity'::timestamptz)
            ) AS unread
     FROM enquiries e
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
}

export async function getMyEnquiry(req, res) {
  const id = parseId(req.params.id);
  const detail = id && (await loadEnquiryDetail(id, req.user.id));
  if (!detail) return res.status(404).json({ message: "Enquiry not found" });
  res.json(detail);
}

export async function markMyEnquirySeen(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await enquiryExists(id, req.user.id))) {
    return res.status(404).json({ message: "Enquiry not found" });
  }
  const { rows } = await pool.query(
    `UPDATE enquiries SET customer_last_seen_at = now() WHERE id = $1
     RETURNING id, customer_last_seen_at`,
    [id]
  );
  res.json(rows[0]);
}

export async function postMyMessage(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await enquiryExists(id, req.user.id))) {
    return res.status(404).json({ message: "Enquiry not found" });
  }
  const { kind, body, proposed_at } = req.body;
  const error = checkMessage(kind, ["message", "date_request"], body, proposed_at);
  if (error) return res.status(400).json({ message: error });

  const message = await withTransaction((db) =>
    addMessage(db, {
      enquiryId: id,
      sender: "customer",
      kind,
      body: body ?? null,
      proposedAt: proposed_at ?? null,
    })
  );
  res.status(201).json(message);
}

export async function confirmMyEnquiry(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await enquiryExists(id, req.user.id))) {
    return res.status(404).json({ message: "Enquiry not found" });
  }
  const { consultation_at } = req.body;
  const error = checkDate(consultation_at, "consultation_at");
  if (error) return res.status(400).json({ message: error });

  const detail = await withTransaction(async (db) => {
    await confirmConsultation(db, { enquiryId: id, sender: "customer", consultationAt: consultation_at });
    return loadEnquiryDetail(id, req.user.id, db);
  });
  res.json(detail);
}

// Shared with the admin routes: kind must be allowed for the sender,
// a message needs a body, and a date proposal or request needs a date.
export function checkMessage(kind, allowedKinds, body, proposedAt) {
  if (!allowedKinds.includes(kind)) return `kind must be one of ${allowedKinds.join(", ")}`;
  if (kind === "message" && !nonEmpty(body)) return "body is required for a message";
  if (kind !== "message") return checkDate(proposedAt, "proposed_at");
  return null;
}
