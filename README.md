# SafeTrace — Anonymous Harassment Reporting & Investigation Platform

An encrypted, token-based two-way communication platform for anonymous harassment
reporting, built for hackathon demo speed with an in-memory backend.

## Stack

- **Frontend:** React (JavaScript, no TypeScript), vanilla CSS only
- **Backend:** Node.js + Express, in-memory data store
- **Architecture:** two portals — Survivor Portal and ICC Command Center — toggled from the top nav

## Quick start

```bash
npm run install-all
npm run dev
```

This starts the API on `http://localhost:5000` and the React dev server on
`http://localhost:3000` (proxied to the API), concurrently.

To run them separately:

```bash
# terminal 1
cd server && npm install && npm start

# terminal 2
cd client && npm install && npm start
```

## Key flows to demo

1. **Survivor Portal → File a Report** — pick a category, describe the incident,
   try **✨ AI Auto-Polish**, drag a file into the Evidence Locker (real SHA-256
   hash computed client-side), submit, and save the generated tracking token
   (e.g. `ST-8921-XRT9`).
2. **Survivor Portal → Check Case Status** — enter the token to see the
   milestone progress tracker and reply in the encrypted thread.
3. **ICC Command Center** — stats cards, the zone heatmap, the emergency triage
   panel (click **Open Chat** on a case to message the reporter and change
   status), analytics/hotspots, and the security audit trail.

No IP addresses, device identifiers, or account data are ever persisted —
cases are identified solely by their anonymous tracking token.
