import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const PHONE_NUMBER_PATTERN = /^[0-9]{11}$/;

export function signToken({ id, role }) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function signup(req, res) {
  const { firstName, lastName, email, password, confirmPassword, phone } = req.body;
  if (!firstName || !lastName || !email || !password || !confirmPassword || !phone) {
    return res.status(400).json({
      message: "firstName, lastName, email, password, confirmPassword, and phone are required",
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  if (!PHONE_NUMBER_PATTERN.test(phone)) {
    return res.status(400).json({ message: "phone must be exactly 11 digits" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      `INSERT INTO users (name, first_name, last_name, email, password_hash, role, phone_number)
       VALUES ($1, $2, $3, $4, $5, 'customer', $6)
       RETURNING id, name, first_name, last_name, role, phone_number`,
      [`${firstName} ${lastName}`, firstName, lastName, email, passwordHash, phone]
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
