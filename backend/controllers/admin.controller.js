import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { withTransaction } from "../lib/tx.js";
import {
  ENQUIRY_STATUSES,
  parseId,
  checkDate,
  loadEnquiryDetail,
  enquiryExists,
  addMessage,
  confirmConsultation,
} from "../lib/enquiries.js";
import { checkMessage } from "./enquiries.controller.js";
import { signToken } from "./auth.controller.js";

// Checks the password before the role, so a 403 only goes to someone who
// knows a customer's password. An unknown email and a wrong password both get 401.
export async function adminLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const result = await pool.query(
    `SELECT id, name, role, password_hash FROM users WHERE email = $1`,
    [email]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, role: user.role },
  });
}

export async function listCustomers(req, res) {
  const result = await pool.query(
    `SELECT name, email FROM users WHERE role = 'customer' ORDER BY created_at`
  );
  res.json(result.rows);
}

export async function listEnquiries(req, res) {
  const status = req.query.status;
  if (status !== undefined && !ENQUIRY_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of ${ENQUIRY_STATUSES.join(", ")}` });
  }
  const result = await pool.query(
    `SELECT e.id, e.status, e.consultation_at, e.created_at, e.updated_at,
            u.name AS customer_name, u.email AS customer_email
     FROM enquiries e JOIN users u ON u.id = e.user_id
     WHERE ($1::text IS NULL OR e.status = $1)
     ORDER BY e.created_at DESC`,
    [status ?? null]
  );
  res.json(result.rows);
}

export async function getEnquiry(req, res) {
  const id = parseId(req.params.id);
  const detail = id && (await loadEnquiryDetail(id));
  if (!detail) return res.status(404).json({ message: "Enquiry not found" });
  res.json(detail);
}

export async function postAdminMessage(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await enquiryExists(id))) {
    return res.status(404).json({ message: "Enquiry not found" });
  }
  const { kind, body, proposed_at } = req.body;
  const error = checkMessage(kind, ["message", "date_proposal"], body, proposed_at);
  if (error) return res.status(400).json({ message: error });

  const message = await withTransaction((db) =>
    addMessage(db, {
      enquiryId: id,
      sender: "admin",
      kind,
      body: body ?? null,
      proposedAt: proposed_at ?? null,
    })
  );
  res.status(201).json(message);
}

export async function confirmEnquiry(req, res) {
  const id = parseId(req.params.id);
  if (!id || !(await enquiryExists(id))) {
    return res.status(404).json({ message: "Enquiry not found" });
  }
  const { consultation_at } = req.body;
  const error = checkDate(consultation_at, "consultation_at");
  if (error) return res.status(400).json({ message: error });

  const detail = await withTransaction(async (db) => {
    await confirmConsultation(db, { enquiryId: id, sender: "admin", consultationAt: consultation_at });
    return loadEnquiryDetail(id, null, db);
  });
  res.json(detail);
}

export async function getStats(req, res) {
  const [garments, fabrics, statuses] = await Promise.all([
    pool.query(
      `SELECT garment, COUNT(*)::int AS count FROM enquiry_items GROUP BY garment ORDER BY garment`
    ),
    pool.query(
      `SELECT fabric_type, COUNT(*)::int AS count FROM enquiry_items GROUP BY fabric_type ORDER BY fabric_type`
    ),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM enquiries GROUP BY status ORDER BY status`),
  ]);
  res.json({
    by_garment: garments.rows,
    by_fabric_type: fabrics.rows,
    by_status: statuses.rows,
  });
}
