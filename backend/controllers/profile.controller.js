import { pool } from "../db/pool.js";
import { checkMeasurements } from "../lib/measurements.js";

const PROFILE_SELECT = `
  SELECT first_name, last_name,
         height_cm::double precision AS height_cm,
         weight_kg::double precision AS weight_kg,
         age, email, phone_number AS phone
  FROM users WHERE id = $1`;

export async function getProfile(req, res) {
  const result = await pool.query(PROFILE_SELECT, [req.user.id]);
  res.json(result.rows[0]);
}

// A field that is missing or null keeps its saved value (COALESCE), so a
// partial update only touches what the client sent.
export async function patchProfile(req, res) {
  const { height_cm, weight_kg, age } = req.body;
  const error = checkMeasurements({ height_cm, weight_kg, age });
  if (error) return res.status(400).json({ message: error });

  await pool.query(
    `UPDATE users
     SET height_cm = COALESCE($1, height_cm),
         weight_kg = COALESCE($2, weight_kg),
         age = COALESCE($3, age)
     WHERE id = $4`,
    [height_cm ?? null, weight_kg ?? null, age ?? null, req.user.id]
  );
  const result = await pool.query(PROFILE_SELECT, [req.user.id]);
  res.json(result.rows[0]);
}
