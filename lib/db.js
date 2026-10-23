// Storage layer. Uses Postgres (Neon / Vercel Postgres) when DATABASE_URL is set,
// otherwise falls back to an in-memory store so the app still runs locally.
const STATUSES = ['Available', 'Busy', 'Away'];
const SEED = require('../data/team_availability_seed.json');
// Sample rows from the first version of this project; replaced by the new seed automatically.
const LEGACY = ['Aarav Mehta', 'Priya Nair', 'Rohan Gupta', 'Sneha Iyer', 'Kabir Shah', 'Ananya Rao'];

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let sql = null;
let ready = null;
if (url) {
  const { neon } = require('@neondatabase/serverless');
  sql = neon(url);
}

function validTimezone(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}

const iso = (r) => ({ ...r, updated_at: new Date(r.updated_at).toISOString() });

// ---- in-memory fallback ----
const mem = globalThis.__tat || (globalThis.__tat = {
  next: Math.max(...SEED.map((s) => s.id)) + 1,
  rows: SEED.map((s) => ({ ...s, updated_at: new Date().toISOString() })),
});

async function init() {
  if (!sql) return;
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Available'
          CHECK (status IN ('Available','Busy','Away')),
        timezone TEXT NOT NULL DEFAULT 'UTC',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC'`;
      const existing = await sql`SELECT name FROM members`;
      const legacy = existing.length === LEGACY.length && existing.every((r) => LEGACY.includes(r.name));
      if (existing.length === 0 || legacy) {
        if (legacy) await sql`TRUNCATE members RESTART IDENTITY`;
        await sql`INSERT INTO members (name, role, status, timezone)
          SELECT * FROM unnest(
            ${SEED.map((s) => s.name)}::text[],
            ${SEED.map((s) => s.role)}::text[],
            ${SEED.map((s) => s.status)}::text[],
            ${SEED.map((s) => s.timezone)}::text[])`;
      }
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}

async function list() {
  if (!sql) return [...mem.rows].sort((a, b) => a.id - b.id);
  await init();
  const rows = await sql`SELECT id, name, role, status, timezone, updated_at FROM members ORDER BY id`;
  return rows.map(iso);
}

async function add(name, role, timezone) {
  if (!sql) {
    const row = { id: mem.next++, name, role, status: 'Available', timezone, updated_at: new Date().toISOString() };
    mem.rows.push(row);
    return row;
  }
  await init();
  const [r] = await sql`INSERT INTO members (name, role, timezone) VALUES (${name}, ${role}, ${timezone})
    RETURNING id, name, role, status, timezone, updated_at`;
  return iso(r);
}

async function setStatus(id, status) {
  if (!sql) {
    const row = mem.rows.find((r) => r.id === id);
    if (!row) return null;
    row.status = status;
    row.updated_at = new Date().toISOString();
    return row;
  }
  await init();
  const rows = await sql`UPDATE members SET status = ${status}, updated_at = now()
    WHERE id = ${id} RETURNING id, name, role, status, timezone, updated_at`;
  return rows.length ? iso(rows[0]) : null;
}

async function remove(id) {
  if (!sql) {
    const i = mem.rows.findIndex((r) => r.id === id);
    if (i < 0) return false;
    mem.rows.splice(i, 1);
    return true;
  }
  await init();
  const rows = await sql`DELETE FROM members WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

module.exports = { STATUSES, validTimezone, list, add, setStatus, remove, persistent: !!sql };
