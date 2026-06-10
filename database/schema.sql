CREATE DATABASE IF NOT EXISTS handicare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE handicare;

CREATE TABLE IF NOT EXISTS resources (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  type VARCHAR(60) NOT NULL,
  disability_keys VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  latitude DOUBLE,
  longitude DOUBLE,
  phone VARCHAR(40),
  whatsapp VARCHAR(40),
  email VARCHAR(140),
  website VARCHAR(255),
  opening_hours VARCHAR(140),
  accessibility_score INT,
  accessibility_features VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  services VARCHAR(500),
  languages VARCHAR(255),
  contact_preference VARCHAR(80),
  event_start DATETIME NULL,
  event_end DATETIME NULL,
  organizer VARCHAR(180),
  registration_link VARCHAR(255),
  cost VARCHAR(80),
  last_updated DATE,
  google_rating DOUBLE,
  google_review_count INT,
  source VARCHAR(80),
  source_url TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  role VARCHAR(80),
  principal BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  preferred_need VARCHAR(80),
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS association_accounts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  association_name VARCHAR(180) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(40),
  address VARCHAR(255),
  latitude DOUBLE,
  longitude DOUBLE,
  disability_keys VARCHAR(255),
  services VARCHAR(500),
  description TEXT,
  contact_person VARCHAR(140),
  status VARCHAR(40),
  platform_email VARCHAR(180) UNIQUE
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  resource_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  appointment_difficulty VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_reviews_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  CONSTRAINT uk_reviews_resource_user UNIQUE (resource_id, user_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_reviews_resource ON reviews(resource_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  resource_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  CONSTRAINT uk_favorites_user_resource UNIQUE (user_id, resource_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_resource ON favorites(resource_id);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  receiver_id BIGINT NOT NULL,
  receiver_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  `read` BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, receiver_type);
