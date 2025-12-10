const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - Reservation service now uses auth-service for users and cars-service for cars
// The voiture and user routes are removed as they are handled by their respective services
app.use('/reservation', require('./routes/reservation.routes'));
app.use('/contrat', require('./routes/contrat.routes'));

// Static files for generated PDFs
app.use('/files', express.static(path.join(__dirname, '..', 'uploads', 'contrats')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Reservation service is running',
    dependencies: {
      authService: 'auth-service (for users)',
      carsService: 'cars-service (for voitures)'
    }
  });
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
const PORT = process.env.PORT || 3004;
const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://discovery:3000';
const SERVICE_NAME = 'reservation-service';
const SERVICE_URL = process.env.SERVICE_URL || `http://reservation:${PORT}`;

app.listen(PORT, async () => {
  console.log(`Reservation Service is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Using auth-service for users and cars-service for voitures`);

  try {
    await axios.post(`${DISCOVERY_URL}/register`, {
      serviceName: SERVICE_NAME,
      url: SERVICE_URL
    });
    console.log(`Registered ${SERVICE_NAME} with Discovery Service`);
  } catch (error) {
    console.error('Failed to register with Discovery Service:', error.message);
  }
});

module.exports = app;
