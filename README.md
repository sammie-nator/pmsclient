# Nyumbani OS — Client

React (Create React App, no Vite) + Tailwind frontend for the property
management system. Three role-gated panels: Admin, Agent, Front Desk.

## Setup

```bash
npm install
cp .env.example .env   # point REACT_APP_API_URL at your running backend
npm start
```

Runs on `http://localhost:3000`. Make sure the server (see `../server`) is
running first, or every request will fail with a connection error.

## How sign-in works (no JWT yet)

The landing page (`/`) is a role picker: choose Admin, Agent, or Front Desk,
then pick a name from the staff directory or type a new one. That pair is
stored in `localStorage` and stamped onto every API request as `x-role` /
`x-actor-name` headers (see `src/lib/api.js`), which is how the backend
enforces permissions and how comments/history get attributed. There's no
password - swap this for real auth later without touching the API calls.

## Structure

```
src/
  components/     shared UI: Shell (sidebar), Panel, Button, Badge, Modal,
                  ConfirmDialog, CommentThread, FormField, StatCard,
                  WindowGrid (the "lit windows" occupancy indicator)
  context/        ActorContext - persists the picked role/name
  lib/            api.js (axios + header interceptor), format.js (KES, dates)
  pages/
    RoleGate.jsx        the sign-in screen
    admin/              full CRUD: dashboard, properties, tenants (+detail),
                        billing, staff
    agent/              read-only: dashboard, properties (no financials)
    frontdesk/          dashboard; reuses the admin Tenants/Billing pages,
                        which are role-aware and hide delete controls
    MaintenancePage.jsx shared across all three roles
```

## Design system

Dark "control tower" theme - see `tailwind.config.js` for the full token
list (base/surface/signal/amber/rose/ink colors, Space Grotesk / Inter /
JetBrains Mono type). The signature element is `WindowGrid`: a small grid of
"windows" on every property card that light up teal when occupied, sit dim
when vacant, and flicker amber during maintenance.
