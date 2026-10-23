# Team Availability Tracker

Live team status board (Available / Busy / Away) backed by Postgres, deployable on Vercel.

## Deploy
1. Push this folder to GitHub and import it in Vercel (no build settings needed).
2. In the Vercel project: Storage -> Create Database -> Neon (Postgres). This adds `DATABASE_URL` automatically.
3. Redeploy. The table is created and seeded on the first request.

## Local run
    npm install
    npx vercel dev          # without DATABASE_URL it uses an in-memory store

## Seed data
`data/team_availability_seed.json` (40 members) is loaded into an empty table on first request. The old 6-person sample data is replaced automatically.

## API
- GET    /api/members             list members
- POST   /api/members             { name, role, timezone }
- PATCH  /api/members/:id         { status: "Available" | "Busy" | "Away" }
- DELETE /api/members/:id

Live updates use 3s polling because Vercel serverless functions cannot hold WebSocket connections.

Working Link - https://team-availability-tracker-iota.vercel.app/
