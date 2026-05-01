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
- `LIVEKIT_PUBLIC_URL` (recommended for production browsers)
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

### Production self-host notes

- Browsers must connect through a public secure WebSocket URL (`wss://...`).
- Set `LIVEKIT_PUBLIC_URL` to your public LiveKit endpoint.
- Keep `LIVEKIT_URL` as internal/private if needed by your infra.
- If `LIVEKIT_PUBLIC_URL` is not set, backend falls back to `LIVEKIT_URL`.

### LiveKit Cloud setup (recommended)

If you are using LiveKit Cloud, set:

```bash
LIVEKIT_PUBLIC_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=<your_api_key>
LIVEKIT_API_SECRET=<your_api_secret>
```

### No-subdomain setup (DuckDNS)

If your hosting provider cannot create subdomains, use a free DuckDNS domain
for LiveKit signaling/media, for example `ogadoctorrtc.duckdns.org`.

Run this on your LiveKit VM (Ubuntu/Debian):

```bash
sudo bash scripts/livekit/setup-duckdns-livekit.sh ogadoctorrtc.duckdns.org <LIVEKIT_API_KEY> <LIVEKIT_API_SECRET> <DUCKDNS_TOKEN>
```

Then set backend production env:

```bash
LIVEKIT_PUBLIC_URL=wss://ogadoctorrtc.duckdns.org
LIVEKIT_API_KEY=<LIVEKIT_API_KEY>
LIVEKIT_API_SECRET=<LIVEKIT_API_SECRET>
```

Notes:

- The script configures LiveKit, Caddy TLS, systemd services, and firewall.
- You must also allow ports in your cloud provider firewall/security group:
  `80/tcp`, `443/tcp`, `7881/tcp`, `50000-50100/udp`.

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
