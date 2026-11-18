import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { COUNTRY_CODE_VALUES } from "../constants/countryCodes.js";

const PHONE_NUMBER_PATTERN = /^[0-9]{11}$/;

export function signToken({ id, role }) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function signup(req, res) {
  const { name, email, password, countryCode, phoneNumber } = req.body;
  if (!name || !email || !password || !countryCode || !phoneNumber) {
    return res.status(400).json({
      message: "name, email, password, countryCode, and phoneNumber are required",
    });
  }
  if (!COUNTRY_CODE_VALUES.includes(countryCode)) {
    return res.status(400).json({ message: "Unrecognized country code" });
  }
  if (!PHONE_NUMBER_PATTERN.test(phoneNumber)) {
    return res.status(400).json({ message: "phoneNumber must be exactly 11 digits" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, country_code, phone_number)
       VALUES ($1, $2, $3, 'customer', $4, $5)
       RETURNING id, name, role, country_code, phone_number`,
      [name, email, passwordHash, countryCode, phoneNumber]
    );
    const user = result.rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "An account with that email already exists" });
    }
    throw err;
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const result = await pool.query(
    `SELECT id, name, role, password_hash FROM users WHERE email = $1`,
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, role: user.role },
  });
}
