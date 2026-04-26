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
import indexRouter from './routes/index.js';
import { startKeepAliveCron } from './services/keepAlive.js';

dotenv.config();

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

app.set('view engine', 'ejs');

// Make io available in controllers
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

// Routes
// app.use("/", indexRouter);
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
