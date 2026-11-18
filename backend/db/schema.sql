-- TailorTrack schema. Six tables, FK order. Re-runnable (IF NOT EXISTS).
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

CREATE TABLE IF NOT EXISTS measurements (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL UNIQUE REFERENCES users(id),
  chest numeric,
  waist numeric,
  hip numeric,
  shoulder_width numeric,
  sleeve_length numeric,
  inseam numeric,
  neck numeric,
  bicep numeric,
  wrist numeric,
  thigh numeric,
  knee numeric,
  rise numeric,
  hem numeric,
  garment_length numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES users(id),
  garment_type text NOT NULL CHECK (
    garment_type IN ('shirt', 'pant', 'panjabi', 'suit_2pc', 'suit_3pc', 'kurta', 'blouse', 'other')
  ),
  style_notes text,
  fabric_note text,
  fit_type text,
  lapel_style text CHECK (lapel_style IS NULL OR lapel_style IN ('notch', 'peak', 'shawl')),
  measurements_snapshot jsonb,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'fast', 'urgent')),
  status text NOT NULL DEFAULT 'requested' CHECK (
    status IN (
      'requested', 'needs_changes', 'quoted', 'declined',
      'confirmed', 'cutting', 'stitching', 'ready', 'completed'
    )
  ),
  due_date date,
  quoted_price numeric,
  advance_required numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  from_status text,
  to_status text NOT NULL,
  note text,
  changed_by text NOT NULL CHECK (changed_by IN ('admin', 'system', 'customer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  type text NOT NULL CHECK (type IN ('advance', 'balance')),
  amount numeric NOT NULL,
  gateway_transaction_id text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  sender text NOT NULL CHECK (sender IN ('admin', 'system')),
  recipient_id integer NOT NULL REFERENCES users(id),
  message text NOT NULL,
  order_id integer REFERENCES orders(id),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Columns added after their table's initial CREATE TABLE already ran in
-- dev/test. IF NOT EXISTS makes re-running this file safe either way, but
-- these must come LAST — each references a table that must already exist,
-- which isn't guaranteed yet on a brand-new database if these ran earlier
-- in the file (the bug CI caught: ALTER TABLE orders before CREATE TABLE
-- orders broke a fresh database, even though it was harmless on one that
-- already had the table).
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number text
  CHECK (phone_number IS NULL OR phone_number ~ '^[0-9]{11}$');
ALTER TABLE orders ADD COLUMN IF NOT EXISTS measurements_snapshot jsonb;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS bicep numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS wrist numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS thigh numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS knee numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS rise numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS hem numeric;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS garment_length numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fit_type text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lapel_style text
  CHECK (lapel_style IS NULL OR lapel_style IN ('notch', 'peak', 'shawl'));
