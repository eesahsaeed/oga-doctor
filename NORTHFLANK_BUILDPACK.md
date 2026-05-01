# Northflank Buildpack Configuration (OgaDoctor)

This project is ready for a **Northflank Buildpack** deployment.

## 1) Service type

Create a **Combined Service** in Northflank and connect this repository/branch.

## 2) Build settings

Use these values:

- Build type: `Buildpack`
- Build context: repository root (`/`)
- Build command: `npm run build:northflank`
- Install command (optional override): `npm ci --include=dev`

Notes:

- `Procfile` is included and sets the web process to `node server/index.js`.
- Node version is pinned in `package.json` engines (`>=20 <25`).

## 3) Runtime/start settings

Use either of these:

- Default process (recommended): from `Procfile`
- Or override command: `node server/index.js`

Do **not** use `npm start` for Northflank unless you intentionally want the `prestart` build step to run at runtime.

## 4) Ports

- Northflank Buildpack web services expose a public HTTP port.
- The server already binds to `process.env.PORT`, so no code change is needed.

## 5) Health checks

Configure HTTP health checks:

- Path: `/api/health`
- Expected status: `200`

Recommended:

- Readiness check: `/api/health`
- Liveness check: `/api/health`

## 6) Environment variables

Add environment variables from:

- [northflank.env.example](/C:/Users/DEEBAH%20GLOBAL%20ICT/Desktop/Workbench/ogadoctor/ogadoctor-new/northflank.env.example)

Minimum required to boot safely:

- `NODE_ENV=production`
- `JWT_SECRET`

Feature-required variables:

- AI chat: `OPENAI_SECRET_KEY`
- AWS/DynamoDB: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- Google auth: `GOOGLE_CLIENT_ID` and related Google keys

For same-domain frontend/backend deployment, these are optional:

- `VITE_API_BASE_URL` (defaults to `/api`)

## 7) Keep-alive on Northflank

Set:

- `KEEP_ALIVE_ENABLED=false`

Northflank services do not require the Render anti-sleep ping behavior.

## 8) Deploy verification checklist

After deploy, verify:

1. `GET /api/health` returns `200`.
2. App shell loads from `/`.
3. Auth endpoints respond under `/api`.
4. Video consultation signaling connects (socket status becomes `connected`).
5. Chat/video room join works in two browser tabs/devices.
