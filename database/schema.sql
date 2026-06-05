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
  source_url VARCHAR(500)
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
  status VARCHAR(40)
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
