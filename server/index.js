import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import userRoutes from './routes/userRoutes.js';
import setupSocket from './socket/socketHandler.js';
import { startKeepAliveCron } from './services/keepAlive.js';

dotenv.config();

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // change to your frontend URL in production
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function resolveClientBuildPath() {
  const candidates = [
    path.resolve(__dirname, '../client'), // dist runtime: dist/server -> dist/client
    path.resolve(__dirname, '../client/dist'), // source runtime: server -> client/dist
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(process.cwd(), 'client/dist'),
  ];

  function isBuiltClientDir(candidate) {
    return (
      fs.existsSync(path.join(candidate, 'index.html')) &&
      fs.existsSync(path.join(candidate, 'assets'))
    );
  }

  for (const candidate of candidates) {
    if (isBuiltClientDir(candidate)) {
      return candidate;
    }
  }

  return null;
}

function buildRtcConfig() {
  const defaultIceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
  const iceServers = [...defaultIceServers];

  try {
    const rawJson = process.env.RTC_ICE_SERVERS;
    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((server) => {
          if (server && typeof server === 'object' && server.urls) {
            iceServers.push(server);
          }
        });
      }
    }
  } catch (error) {
    console.warn('[rtc] Failed to parse RTC_ICE_SERVERS JSON:', error.message);
  }

  const turnUrls = (process.env.TURN_URLS || process.env.TURN_URL || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential =
    process.env.TURN_PASSWORD || process.env.TURN_CREDENTIAL;

  if (turnUrls.length && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return { iceServers };
}

// Routes
app.use('/api', userRoutes);
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});
app.get('/api/ping', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});
app.get('/api/rtc-config', (_req, res) => {
  res.status(200).json(buildRtcConfig());
});

const clientBuildPath = resolveClientBuildPath();
if (clientBuildPath) {
  app.use(
    express.static(clientBuildPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      },
    }),
  );

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Requests for concrete files should 404 if missing (e.g. stale CSS hash),
    // not fall back to index.html.
    if (path.extname(req.path)) {
      return res.status(404).end();
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Helpful response when frontend build is missing in production/runtime.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.status(503).json({
      success: false,
      message:
        'Frontend build is missing. Run `npm run build` before starting the server.',
    });
  });
}

// Socket setup
setupSocket(io);

const PORT = process.env.PORT || 4000;

export function startServer(port = PORT) {
  httpServer.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(
        `[server] Port ${port} is already in use. Stop the existing process or change PORT.`,
      );
      return;
    }
    console.error('[server] Failed to start:', error?.message || error);
  });

  return httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.io ready at ws://localhost:${port}`);
    startKeepAliveCron();
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer(PORT);
}

export { app, httpServer };
