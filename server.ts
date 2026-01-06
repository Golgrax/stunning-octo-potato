import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { productsRouter } from './api/products';
import { ordersRouter } from './api/orders';
import { authRouter } from './api/auth';
import { inventoryRouter } from './api/inventory';
import { adminRouter } from './api/admin';
import { paymentRouter } from './api/payment';
import { aiRouter } from './api/ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // Allow all origins for simplicity in this demo
    methods: ["GET", "POST"]
  }
});

// Make io available to routes
export { io };

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/ai', aiRouter);

// Handle SPA routing: serve index.html for any non-API route
app.get(/.*/, (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  // ... (rest of socket logic remains same)


  // Join order-specific room (for customers)
  socket.on('join-order', (orderId: string) => {
    socket.join(`order-${orderId}`);
    console.log(`📦 Client ${socket.id} joined order room: ${orderId}`);
  });

  // Leave order room
  socket.on('leave-order', (orderId: string) => {
    socket.leave(`order-${orderId}`);
    console.log(`📤 Client ${socket.id} left order room: ${orderId}`);
  });

  // Join admin room (for admin dashboard)
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log(`👨‍💼 Admin client ${socket.id} joined admin room`);
  });

  // Leave admin room
  socket.on('leave-admin', () => {
    socket.leave('admin-room');
    console.log(`👨‍💼 Admin client ${socket.id} left admin room`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server with Socket.IO
httpServer.listen(PORT, () => {
  console.log(`🚀 Lumina Café API Server running on http://localhost:${PORT}`);
  
  // Check API Key
  if (!process.env.API_KEY || process.env.API_KEY === 'YOUR_API_KEY') {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  WARNING: Google Gemini API Key is missing or invalid in .env file!');
    console.warn('\x1b[33m%s\x1b[0m', '   AI features ("Ask Barista") will not work.');
    console.warn('\x1b[33m%s\x1b[0m', '   Please edit the .env file and restart the server.');
  } else {
    console.log('✨ Gemini API Key loaded.');
  }

  console.log(`🔌 WebSocket server enabled for real-time updates`);
  console.log(`📡 Available endpoints:`);
  console.log(`   - GET  /api/products`);
  console.log(`   - GET  /api/products/:id`);
  console.log(`   - POST /api/products`);
  console.log(`   - PUT  /api/products/:id`);
  console.log(`   - GET  /api/orders`);
  console.log(`   - GET  /api/orders/:id`);
  console.log(`   - POST /api/orders`);
  console.log(`   - PUT  /api/orders/:id`);
  console.log(`   - GET  /api/inventory`);
  console.log(`   - GET  /api/inventory/:productId`);
  console.log(`   - PUT  /api/inventory/:productId`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /health`);
});

export default app;

