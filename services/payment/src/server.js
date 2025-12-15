const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');
const http = require('http');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paymentdb';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Payment Service: Database connected'))
  .catch((err) => console.error('Payment Service: Database connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/payments', require('./routes/payment.routes'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'payment-service', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO for real-time payment notifications
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('msg', 'Connected to payment service');

  socket.on('payment-update', (data) => {
    io.emit('payment-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 3003;
const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://localhost:4000';
const SERVICE_NAME = 'payment-service';
const SERVICE_ADDRESS = process.env.SERVICE_ADDRESS || 'http://localhost';
const DISCOVERY_REGISTER_ATTEMPTS = Number(process.env.DISCOVERY_REGISTER_ATTEMPTS || 10);

async function registerWithDiscovery(attempt = 1) {
  try {
    await axios.post(`${DISCOVERY_URL}/register`, {
      name: SERVICE_NAME,
      address: SERVICE_ADDRESS,
      port: PORT
    });
    console.log(`Registered ${SERVICE_NAME} with Discovery Service`);
  } catch (error) {
    console.error('Failed to register with Discovery Service:', error.message);
    if (attempt < DISCOVERY_REGISTER_ATTEMPTS) {
      setTimeout(() => registerWithDiscovery(attempt + 1), 3000);
    }
  }
}

server.listen(PORT, async () => {
  console.log(`Payment Service is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Register with Discovery Service
  registerWithDiscovery();
});

module.exports = app;
