-- =====================================================================
-- ARUL ELECTRICAL — database schema
-- Run in MySQL Workbench, or simply run:  php database/setup.php
-- (setup.php runs this file AND seeds the content + media library)
-- Connection settings live in backend/.env
-- =====================================================================

CREATE DATABASE IF NOT EXISTS arul_electricals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE arul_electricals;

-- ---------- Admin users & login sessions ----------
CREATE TABLE IF NOT EXISTS admins (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(150) NOT NULL DEFAULT 'Administrator',
  last_login  DATETIME NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT NOT NULL,
  token_hash  CHAR(64) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Media library: every website image ----------
CREATE TABLE IF NOT EXISTS media (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  file_name      VARCHAR(255) NOT NULL,
  original_name  VARCHAR(255) NOT NULL,
  path           VARCHAR(255) NOT NULL UNIQUE,      -- e.g. uploads/media/hero-1a2b3c.jpg
  mime           VARCHAR(100) NOT NULL,
  size           INT NOT NULL DEFAULT 0,
  width          INT NULL,
  height         INT NULL,
  alt_text       VARCHAR(255) NOT NULL DEFAULT '',
  folder         VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Single-record sections (hero, about, headings, CTA, contact, settings) ----------
CREATE TABLE IF NOT EXISTS sections (
  section_key  VARCHAR(50) PRIMARY KEY,
  data         LONGTEXT NOT NULL,                  -- JSON
  is_visible   TINYINT(1) NOT NULL DEFAULT 1,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Repeatable cards ----------
CREATE TABLE IF NOT EXISTS capabilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  icon VARCHAR(50) DEFAULT '',
  link_text VARCHAR(100) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  tag VARCHAR(60) DEFAULT '',
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  icon VARCHAR(50) DEFAULT '',
  button_text VARCHAR(60) DEFAULT 'Enquire Now',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS why_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  client VARCHAR(150) DEFAULT '',
  category VARCHAR(80) DEFAULT '',
  tag VARCHAR(80) DEFAULT '',
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  link_text VARCHAR(80) DEFAULT '',
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_illustrative TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS process_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  phase VARCHAR(60) DEFAULT '',
  icon VARCHAR(50) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(150) DEFAULT '',
  company VARCHAR(150) DEFAULT '',
  message TEXT NOT NULL,
  rating TINYINT NULL DEFAULT 5,
  avatar VARCHAR(255) DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Website enquiries ----------
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150) DEFAULT '',
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) DEFAULT '',
  voltage VARCHAR(100) DEFAULT '',
  equipment VARCHAR(100) DEFAULT '',
  location VARCHAR(200) DEFAULT '',
  message TEXT,
  status ENUM('new','read','replied','closed') NOT NULL DEFAULT 'new',
  notes TEXT,
  ip VARCHAR(45) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (status),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Image bytes (only used when MEDIA_STORAGE=db, e.g. on Render) ----------
CREATE TABLE IF NOT EXISTS media_files (
  file_name  VARCHAR(255) PRIMARY KEY,
  mime       VARCHAR(100) NOT NULL,
  content    LONGBLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
