-- Desktop OS Database Schema
-- Run this script to initialize the MySQL database

CREATE DATABASE IF NOT EXISTS desktop_os;
USE desktop_os;

-- Notes table for storing user notes
CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notes_updated (updated_at DESC),
  INDEX idx_notes_title (title)
);

-- Widget settings table for storing plugin/widget configuration
CREATE TABLE IF NOT EXISTS widget_settings (
  id VARCHAR(36) PRIMARY KEY,
  plugin_id VARCHAR(100) NOT NULL,
  settings JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_widget_plugin (plugin_id)
);

-- User preferences table for storing global user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  `key` VARCHAR(100) PRIMARY KEY,
  value JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tags table for organizing notes
CREATE TABLE IF NOT EXISTS tags (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note-tag relationship table (many-to-many)
CREATE TABLE IF NOT EXISTS note_tags (
  note_id VARCHAR(36) NOT NULL,
  tag_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Session storage for window states
CREATE TABLE IF NOT EXISTS window_states (
  id VARCHAR(36) PRIMARY KEY,
  plugin_id VARCHAR(100) NOT NULL,
  state JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_window_plugin (plugin_id)
);
