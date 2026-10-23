-- Run automatically by lib/db.js on first request; kept here for reference.
CREATE TABLE IF NOT EXISTS members (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  role       TEXT        NOT NULL DEFAULT '',
  status     TEXT        NOT NULL DEFAULT 'Available'
             CHECK (status IN ('Available', 'Busy', 'Away')),
  timezone   TEXT        NOT NULL DEFAULT 'UTC',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
