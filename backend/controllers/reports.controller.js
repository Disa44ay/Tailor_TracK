import { pool } from "../db/pool.js";

export async function getReports(req, res) {
  const [statusResult, totalsResult] = await Promise.all([
    pool.query(`SELECT status, count(*)::int AS count FROM orders GROUP BY status`),
    pool.query(`
      SELECT
        COALESCE((SELECT sum(amount) FROM payments), 0)::double precision AS collected,
        COALESCE(
          (
            SELECT sum(o.quoted_price - COALESCE(p.paid, 0))
            FROM orders o
            LEFT JOIN (
              SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id
            ) p ON p.order_id = o.id
            WHERE o.quoted_price IS NOT NULL
          ),
          0
        )::double precision AS outstanding
    `),
  ]);

  const ordersByStatus = {};
  for (const row of statusResult.rows) {
    ordersByStatus[row.status] = row.count;
  }

  res.json({ ordersByStatus, totals: totalsResult.rows[0] });
}
