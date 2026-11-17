import { pool } from "../db/pool.js";

// Liveness check: is the API process up at all.
export function getHealth(req, res) {
  res.json({ status: "ok" });
}

// Readiness check: can the API actually reach Postgres.
export async function getHealthDb(req, res, next) {
  try {
    const result = await pool.query("select now() as db_time");
    res.json({ status: "ok", db_time: result.rows[0].db_time });
  } catch (err) {
    next(err);
  }
}
