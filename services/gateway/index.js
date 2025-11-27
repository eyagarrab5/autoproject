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
            // We don't rewrite path because the auth service expects /api/...
        })(req, res, next);
    };
};

// Route all /api traffic to auth-service for now, as it contains all logic
app.use('/api', createServiceProxy('auth-service'));

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});