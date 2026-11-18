-- TailorTrack schema. Six tables, FK order. Re-runnable (IF NOT EXISTS).
-- Enums are enforced as CHECK constraints rather than Postgres ENUM types,
-- so the allowed values are visible right here and easy to extend.

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'admin')),
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
