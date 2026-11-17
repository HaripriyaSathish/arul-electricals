-- =====================================================================
-- ARUL ELECTRICAL — PostgreSQL schema (Neon, used on Render)
-- Same tables as arul_electricals.sql (MySQL). Applied by database/migrate_to_postgres.php
-- Times are stored as Indian local time (Asia/Kolkata) to match the MySQL version.
-- =====================================================================

CREATE OR REPLACE FUNCTION ist_now() RETURNS timestamp(0) AS $$
  SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::timestamp(0)
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := ist_now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS admins (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(150) NOT NULL DEFAULT 'Administrator',
  last_login  TIMESTAMP(0) NULL,
  created_at  TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id          SERIAL PRIMARY KEY,
  admin_id    INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash  CHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMP(0) NOT NULL,
  created_at  TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS media (
  id             SERIAL PRIMARY KEY,
  file_name      VARCHAR(255) NOT NULL,
  original_name  VARCHAR(255) NOT NULL,
  path           VARCHAR(255) NOT NULL UNIQUE,
  mime           VARCHAR(100) NOT NULL,
  size           INT NOT NULL DEFAULT 0,
  width          INT NULL,
  height         INT NULL,
  alt_text       VARCHAR(255) NOT NULL DEFAULT '',
  folder         VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at     TIMESTAMP(0) DEFAULT ist_now()
);
CREATE INDEX IF NOT EXISTS media_folder_idx ON media (folder);

CREATE TABLE IF NOT EXISTS media_files (
  file_name  VARCHAR(255) PRIMARY KEY,
  mime       VARCHAR(100) NOT NULL,
  content    BYTEA NOT NULL,
  created_at TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS sections (
  section_key  VARCHAR(50) PRIMARY KEY,
  data         TEXT NOT NULL,
  is_visible   SMALLINT NOT NULL DEFAULT 1,
  updated_at   TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS capabilities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  image_alt VARCHAR(255) DEFAULT '',
  icon VARCHAR(50) DEFAULT '',
  link_text VARCHAR(100) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) DEFAULT ist_now(),
  updated_at TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  tag VARCHAR(60) DEFAULT '',
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  image_alt VARCHAR(255) DEFAULT '',
  icon VARCHAR(255) DEFAULT '',
  button_text VARCHAR(60) DEFAULT 'Enquire Now',
  sort_order INT NOT NULL DEFAULT 0,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) DEFAULT ist_now(),
  updated_at TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS why_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) DEFAULT ist_now(),
  updated_at TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  client VARCHAR(150) DEFAULT '',
  category VARCHAR(80) DEFAULT '',
  tag VARCHAR(80) DEFAULT '',
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  image_alt VARCHAR(255) DEFAULT '',
  link_text VARCHAR(80) DEFAULT '',
  is_featured SMALLINT NOT NULL DEFAULT 0,
  is_illustrative SMALLINT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) DEFAULT ist_now(),
  updated_at TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS process_steps (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  phase VARCHAR(60) DEFAULT '',
  icon VARCHAR(50) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) DEFAULT ist_now(),
  updated_at TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(150) DEFAULT '',
  company VARCHAR(150) DEFAULT '',
  message TEXT NOT NULL,
  rating SMALLINT NULL DEFAULT 5,
  avatar VARCHAR(255) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) DEFAULT ist_now(),
  updated_at TIMESTAMP(0) DEFAULT ist_now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150) DEFAULT '',
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) DEFAULT '',
  voltage VARCHAR(100) DEFAULT '',
  equipment VARCHAR(100) DEFAULT '',
  location VARCHAR(200) DEFAULT '',
  message TEXT,
  source VARCHAR(200) DEFAULT '',
  status VARCHAR(10) NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','closed')),
  notes TEXT,
  ip VARCHAR(45) DEFAULT '',
  created_at TIMESTAMP(0) DEFAULT ist_now()
);
CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts (status);
CREATE INDEX IF NOT EXISTS contacts_created_idx ON contacts (created_at);

-- upgrades for databases created before these columns existed
ALTER TABLE capabilities ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(200) DEFAULT '';

-- keep updated_at current on every edit
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sections','capabilities','services','why_items','projects','process_steps','testimonials'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END
$$;
