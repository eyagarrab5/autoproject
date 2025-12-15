const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/user.routes'));
app.use('/profile', require('./routes/profile.routes'));
app.use('/activity', require('./routes/activity.routes'));
app.use('/login-history', require('./routes/loginHistory.routes'));

// Internal routes for service-to-service communication (no auth required)
app.use('/internal', require('./routes/internal.routes'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' }); 
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
const PORT = process.env.PORT || 3001;
const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://localhost:4000';
const SERVICE_NAME = 'auth-service';
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
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  registerWithDiscovery();
});

module.exports = app;
