-- SQLite schema for Crate (multi-user vinyl scrobbler)
-- Run from the backend/ directory:
--   sqlite3 user.db < CREATESCRIPT.sql

DROP TABLE IF EXISTS releases;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS user_credentials;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS app;

CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    INTEGER NOT NULL
);

CREATE TABLE sessions (
    token      TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE TABLE user_credentials (
    user_id                       INTEGER PRIMARY KEY REFERENCES users(id),
    discogs_request_token         TEXT,
    discogs_request_token_secret  TEXT,
    discogs_request_token_expires INTEGER,
    discogs_oauth_token           TEXT,
    discogs_oauth_token_secret    TEXT,
    lastfm_session_key            TEXT,
    last_synced_at                INTEGER
);

-- Per-user collection. basic_information stores JSON from Discogs collection API.
-- Hard-delete when a release is removed from Discogs.
CREATE TABLE collections (
    user_id           INTEGER NOT NULL REFERENCES users(id),
    instance_id       INTEGER NOT NULL,
    release_id        INTEGER NOT NULL,
    date_added        INTEGER,
    basic_information TEXT,
    PRIMARY KEY (user_id, instance_id)
);

-- Shared release cache. Fetched once, permanently cached.
-- Manual refresh per release via the UI.
CREATE TABLE releases (
    release_id INTEGER PRIMARY KEY,
    data       TEXT    NOT NULL,
    fetched_at INTEGER NOT NULL
);
