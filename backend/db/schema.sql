-- Tailor_Track skeleton schema. Users only. Re-runnable (IF NOT EXISTS).
-- Enums are enforced as CHECK constraints rather than Postgres ENUM types,
-- so the allowed values are visible right here and easy to extend.

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'admin')),
  country_code text,
  phone_number text CHECK (phone_number IS NULL OR phone_number ~ '^[0-9]{11}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
