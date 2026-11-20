import { pool } from "../db/pool.js";

const FABRIC_COLUMNS = `
  id, name, color_hex, print_pattern, texture, swatch_image_url,
  price_modifier::double precision AS price_modifier
`;

export async function getFabrics(req, res) {
  const result = await pool.query(
    `SELECT ${FABRIC_COLUMNS} FROM fabrics WHERE is_active = true ORDER BY name`
  );
  res.json(result.rows);
}
