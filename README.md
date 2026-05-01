# OgaDoctor (React + Express + LiveKit)

This project uses:

- React (Vite) frontend
- Express backend
- Self-hosted LiveKit for video consultation and room collaboration

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create your local env file

```bash
cp .env.example .env
```

3. Start development (frontend + backend)

```bash
npm run dev
```

Default ports:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

## LiveKit configuration

Required:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_TOKEN_TTL` (optional, default `2h`)

### Local self-host run

1. Copy `livekit.yaml.example` to `livekit.yaml`
2. Set your key pair in `livekit.yaml`
3. Use the same values in `.env`:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
4. Start LiveKit server locally:

```bash
livekit-server --config livekit.yaml
```

5. Set app server URL in `.env`:
   - `LIVEKIT_URL=ws://localhost:7880`

Backend endpoint used by frontend:

- `POST /api/consultation/livekit/token`

## Production

Build frontend bundle:

```bash
npm run build
```

Run backend (serves both API and built frontend):

```bash
npm start
```

## Useful scripts

- `npm run dev` - run server and client together
- `npm run dev:server` - run backend only
- `npm run dev:client` - run frontend only
- `npm run test` - run backend tests
- `npm run build` - production frontend build
- `npm start` - serve production app
