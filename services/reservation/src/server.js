const express = require('express');
const cors = require('cors');
const axios = require('axios');
const connectDB = require('./config/database');

// Import routes
const reservationRoutes = require('./routes/reservation.routes');
const contratRoutes = require('./routes/contrat.routes');

// Load environment variables
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for contract PDFs
app.use('/uploads', express.static('uploads'));

// Connect to database
connectDB();

// Service configuration
const SERVICE_NAME = 'reservation-service';
const SERVICE_PORT = process.env.PORT || 3004;
const SERVICE_HOST = process.env.SERVICE_HOST || 'localhost';
const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://localhost:3000';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

// Routes (without /api prefix)
app.use('/reservations', reservationRoutes);
app.use('/contrats', contratRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    endpoints: {
      reservations: '/reservations',
      contrats: '/contrats',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Register with discovery service
async function registerWithDiscovery() {
  try {
    await axios.post(`${DISCOVERY_URL}/register`, {
      serviceName: SERVICE_NAME,
      url: `http://${SERVICE_HOST}:${SERVICE_PORT}`
    });
    console.log(`✅ Registered ${SERVICE_NAME} with discovery service`);
  } catch (error) {
    console.error('❌ Failed to register with discovery service:', error.message);
    // Retry after 5 seconds
    setTimeout(registerWithDiscovery, 5000);
  }
}

// Start server
app.listen(SERVICE_PORT, async () => {
  console.log(`🚀 ${SERVICE_NAME} running on port ${SERVICE_PORT}`);
  
  // Register with discovery after a short delay to ensure discovery is ready
  setTimeout(async () => {
    await registerWithDiscovery();
  }, 3000);
});

module.exports = app;
