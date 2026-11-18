import { pool } from "../db/pool.js";

// 14 fields total: the original 7 plus 7 added after researching real
// bespoke-tailoring measurement guides (see design doc "Revision note 2").
const FIELDS = [
  "chest", "waist", "hip", "shoulderWidth", "sleeveLength", "inseam", "neck",
  "bicep", "wrist", "thigh", "knee", "rise", "hem", "garmentLength",
];
const COLUMNS = [
  "chest", "waist", "hip", "shoulder_width", "sleeve_length", "inseam", "neck",
  "bicep", "wrist", "thigh", "knee", "rise", "hem", "garment_length",
];

// numeric columns come back as strings from pg (to avoid float precision
// loss) unless cast; cast to double precision so the API returns real
// JSON numbers, since the frontend does arithmetic/sliders with these.
const SELECT_COLUMNS = COLUMNS.map((col) => `${col}::double precision AS ${col}`).join(",\n  ");

const EMPTY_MEASUREMENTS = Object.fromEntries(COLUMNS.map((col) => [col, null]));

export async function getMyMeasurements(req, res) {
  const result = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM measurements WHERE customer_id = $1`,
    [req.user.id]
  );
  res.json(result.rows[0] ?? EMPTY_MEASUREMENTS);
}

export async function putMyMeasurements(req, res) {
  for (const field of FIELDS) {
    const value = req.body[field];
    if (value !== undefined && value !== null && typeof value !== "number") {
      return res.status(400).json({ message: `${field} must be a number` });
    }
  }

  // Partial update by design: an omitted (or explicitly null) field keeps
  // whatever was already on file — PUT never zeroes a measurement the
  // customer isn't currently updating (e.g. a pant-only form never
  // touches their chest/neck from a prior shirt order). COALESCE picks
  // the new value when one was sent, else falls back to the existing
  // column.
  const values = FIELDS.map((field) => req.body[field] ?? null);
  const insertColumns = COLUMNS.join(", ");
  const insertPlaceholders = COLUMNS.map((_, i) => `$${i + 2}`).join(", ");
  const updateSet = COLUMNS.map((col, i) => `${col} = COALESCE($${i + 2}, measurements.${col})`).join(
    ",\n       "
  );

  const result = await pool.query(
    `INSERT INTO measurements (customer_id, ${insertColumns}, updated_at)
     VALUES ($1, ${insertPlaceholders}, now())
     ON CONFLICT (customer_id) DO UPDATE SET
       ${updateSet},
       updated_at = now()
     RETURNING ${SELECT_COLUMNS}`,
    [req.user.id, ...values]
  );
  res.json(result.rows[0]);
}
