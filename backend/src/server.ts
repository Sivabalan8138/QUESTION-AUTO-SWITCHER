import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';
import { setupSockets } from './sockets';
import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';

// Load env vars
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

// Setup Socket.IO
setupSockets(io);

// Initialize database and start server
const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    // Run simple query to ensure DB is up
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connected successfully.');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
