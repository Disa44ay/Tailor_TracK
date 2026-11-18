import { pool } from "../db/pool.js";

const FIELDS = ["chest", "waist", "hip", "shoulderWidth", "sleeveLength", "inseam", "neck"];

// numeric columns come back as strings from pg (to avoid float precision
// loss) unless cast; cast to double precision so the API returns real
// JSON numbers, since the frontend does arithmetic/sliders with these.
const SELECT_COLUMNS = `
  chest::double precision AS chest,
  waist::double precision AS waist,
  hip::double precision AS hip,
  shoulder_width::double precision AS shoulder_width,
  sleeve_length::double precision AS sleeve_length,
  inseam::double precision AS inseam,
  neck::double precision AS neck
`;

export async function getMyMeasurements(req, res) {
  const result = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM measurements WHERE customer_id = $1`,
    [req.user.id]
  );
  res.json(
    result.rows[0] ?? {
      chest: null,
      waist: null,
      hip: null,
      shoulder_width: null,
      sleeve_length: null,
      inseam: null,
      neck: null,
    }
  );
}

export async function putMyMeasurements(req, res) {
  for (const field of FIELDS) {
    const value = req.body[field];
    if (value !== undefined && value !== null && typeof value !== "number") {
      return res.status(400).json({ message: `${field} must be a number` });
    }
  }

  const values = FIELDS.map((field) => req.body[field] ?? null);
  const result = await pool.query(
    `INSERT INTO measurements (customer_id, chest, waist, hip, shoulder_width, sleeve_length, inseam, neck, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (customer_id) DO UPDATE SET
       chest = EXCLUDED.chest,
       waist = EXCLUDED.waist,
       hip = EXCLUDED.hip,
       shoulder_width = EXCLUDED.shoulder_width,
       sleeve_length = EXCLUDED.sleeve_length,
       inseam = EXCLUDED.inseam,
       neck = EXCLUDED.neck,
       updated_at = now()
     RETURNING ${SELECT_COLUMNS}`,
    [req.user.id, ...values]
  );
  res.json(result.rows[0]);
}
