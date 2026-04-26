import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import setupSocket from './socket/socketHandler.js';
import indexRouter from './routes/index.js';
import { startKeepAliveCron } from './services/keepAlive.js';

dotenv.config();

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
