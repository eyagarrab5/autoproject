const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carsdb';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Cars Service: Database connected'))
  .catch((err) => console.error('Cars Service: Database connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/voitures', require('./routes/voiture.routes'));
app.use('/entretiens', require('./routes/entretien.routes'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'cars-service', message: 'Server is running' });
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

// Start server
const PORT = process.env.PORT || 3002;
const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://localhost:4000';
const SERVICE_NAME = 'cars-service';
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

app.listen(PORT, async () => {
  console.log(`Cars Service is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Register with Discovery Service
  registerWithDiscovery();
});

module.exports = app;
