-- Tailor_Track schema: accounts, consultation requests and their conversation.
-- Re-runnable (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- Enums are CHECK constraints so the allowed values stay visible here.
-- Money is never stored: pricing per gauge is handled by phone or in the
-- consultation, so the web app has no accounting tables.

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

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm numeric(5,1) CHECK (height_cm IS NULL OR height_cm BETWEEN 50 AND 250);
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg numeric(5,1) CHECK (weight_kg IS NULL OR weight_kg BETWEEN 20 AND 300);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age smallint CHECK (age IS NULL OR age BETWEEN 1 AND 120);

-- One admin only. A partial unique index allows at most one row with role = 'admin'.
CREATE UNIQUE INDEX IF NOT EXISTS one_admin_account ON users (role) WHERE role = 'admin';

-- A consultation request: one visit that can hold several garments.
CREATE TABLE IF NOT EXISTS enquiries (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'in_conversation', 'confirmed', 'closed')),
  consultation_at timestamptz,
  customer_last_seen_at timestamptz,
  admin_last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Snapshot of the body measurements at submit time, so an old enquiry keeps the
-- numbers the customer sent even after their profile changes.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS height_cm numeric(5,1) CHECK (height_cm IS NULL OR height_cm BETWEEN 50 AND 250);
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS weight_kg numeric(5,1) CHECK (weight_kg IS NULL OR weight_kg BETWEEN 20 AND 300);
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS age smallint CHECK (age IS NULL OR age BETWEEN 1 AND 120);

CREATE INDEX IF NOT EXISTS enquiries_user_idx ON enquiries (user_id);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);

-- One garment inside an enquiry (one shirt, one pant, one suit, ...).
CREATE TABLE IF NOT EXISTS enquiry_items (
  id serial PRIMARY KEY,
  enquiry_id integer NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  garment text NOT NULL CHECK (garment IN ('shirt', 'pant', 'pajama', 'suit')),
  fabric_type text NOT NULL,
  fabric_colour text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enquiry_items_enquiry_idx ON enquiry_items (enquiry_id);

-- The conversation: customer messages, admin replies, date proposals and answers.
CREATE TABLE IF NOT EXISTS enquiry_messages (
  id serial PRIMARY KEY,
  enquiry_id integer NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer', 'admin')),
  kind text NOT NULL CHECK (kind IN ('message', 'date_proposal', 'date_confirmed', 'date_request')),
  body text,
  proposed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- a text message needs a body; a date proposal or request needs a date
  CHECK (kind <> 'message' OR body IS NOT NULL),
  CHECK (kind NOT IN ('date_proposal', 'date_request') OR proposed_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS enquiry_messages_enquiry_idx ON enquiry_messages (enquiry_id, created_at);
