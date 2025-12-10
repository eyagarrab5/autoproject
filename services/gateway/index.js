const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;
const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://discovery:3000';

// Helper to get service URL from discovery
async function getServiceUrl(serviceName) {
  try {
    const response = await axios.get(`${DISCOVERY_URL}/${serviceName}`);
    return response.data.url;
  } catch (error) {
    console.error(`Error fetching service ${serviceName}:`, error.message);
    return null;
  }
}

// Proxy middleware factory
const createServiceProxy = (serviceName) => {
  return async (req, res, next) => {
    const serviceUrl = await getServiceUrl(serviceName);
    if (!serviceUrl) {
      return res.status(503).json({ message: `${serviceName} unavailable` });
    }
    
    createProxyMiddleware({
      target: serviceUrl,
      changeOrigin: true,
    })(req, res, next);
  };
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'gateway', message: 'Gateway is running' });
});

// List all registered services
app.get('/services', async (req, res) => {
  try {
    const response = await axios.get(DISCOVERY_URL);
    res.json({ services: response.data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
});

// Route auth-related endpoints to auth-service
app.use('/auth', createServiceProxy('auth-service'));
app.use('/users', createServiceProxy('auth-service'));
app.use('/profile', createServiceProxy('auth-service'));
app.use('/activity', createServiceProxy('auth-service'));
app.use('/login-history', createServiceProxy('auth-service'));

// Route cars-related endpoints to cars-service
app.use('/voitures', createServiceProxy('cars-service'));
app.use('/entretiens', createServiceProxy('cars-service'));

// Route payment-related endpoints to payment-service
app.use('/payments', createServiceProxy('payment-service'));

// Route reservation-related endpoints to reservation-service
// Note: reservation service uses auth-service for users and cars-service for voitures
app.use('/reservation', createServiceProxy('reservation-service'));
app.use('/contrat', createServiceProxy('reservation-service'));
app.use('/files', createServiceProxy('reservation-service'));

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log('Routes configured:');
  console.log('  - /auth, /users, /profile, /activity, /login-history -> auth-service');
  console.log('  - /voitures, /entretiens -> cars-service');
  console.log('  - /payments -> payment-service');
  console.log('  - /reservation, /contrat, /files -> reservation-service');
  console.log('Note: reservation-service uses auth-service for users and cars-service for cars');
});