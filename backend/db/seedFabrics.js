// One-shot ops script: seeds a starter fabric catalog for local dev/testing.
// Usage: node db/seedFabrics.js
import "dotenv/config";
import { pool } from "./pool.js";

const FABRICS = [
  { name: "Navy Cotton", colorHex: "#1b2a4a", printPattern: "solid", texture: "cotton" },
  { name: "Charcoal Wool", colorHex: "#3a3a3a", printPattern: "solid", texture: "wool" },
  { name: "Ivory Linen", colorHex: "#f2ead9", printPattern: "solid", texture: "linen" },
  { name: "Burgundy Silk", colorHex: "#5c1a2b", printPattern: "striped", texture: "silk" },
  { name: "Indigo Denim", colorHex: "#2c3e63", printPattern: "checked", texture: "denim" },
];

async function seedFabrics() {
  let created = 0;
  for (const fabric of FABRICS) {
    const result = await pool.query(
      `INSERT INTO fabrics (name, color_hex, print_pattern, texture)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      [fabric.name, fabric.colorHex, fabric.printPattern, fabric.texture]
    );
    if (result.rows.length) created += 1;
  }
  console.log(`Fabrics created: ${created}, already present: ${FABRICS.length - created}`);
  await pool.end();
}

seedFabrics().catch((err) => {
  console.error("Seeding fabrics failed:", err);
  process.exit(1);
});
