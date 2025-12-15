const axios = require('axios');

const DISCOVERY_URL = process.env.DISCOVERY_URL || 'http://discovery:3000';
const USE_DISCOVERY = process.env.USE_DISCOVERY === 'true';

// Direct URLs for local development
const SERVICE_URLS = {
  'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  'cars-service': process.env.CARS_SERVICE_URL || 'http://localhost:3002'
};

// Cache for service URLs
const serviceCache = {};
const CACHE_TTL = 30000; // 30 seconds

async function getServiceUrl(serviceName) {
  // In local development, use direct URLs
  if (!USE_DISCOVERY) {
    return SERVICE_URLS[serviceName] || null;
  }
  
  const now = Date.now();
  
  // Check cache
  if (serviceCache[serviceName] && (now - serviceCache[serviceName].timestamp) < CACHE_TTL) {
    return serviceCache[serviceName].url;
  }
  
  try {
    const response = await axios.get(`${DISCOVERY_URL}/${serviceName}`);
    const url = response.data.url;
    
    // Update cache
    serviceCache[serviceName] = {
      url,
      timestamp: now
    };
    
    return url;
  } catch (error) {
    console.error(`Error fetching service ${serviceName}:`, error.message);
    
    // Return cached value if available (even if expired)
    if (serviceCache[serviceName]) {
      return serviceCache[serviceName].url;
    }
    
    // Fallback to direct URLs
    return SERVICE_URLS[serviceName] || null;
  }
}

// Auth Service Client
const authService = {
  async getUserById(userId, token = null) {
    try {
      const baseUrl = await getServiceUrl('auth-service');
      
      // Use internal endpoint for service-to-service communication
      const response = await axios.get(`${baseUrl}/internal/users/${userId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      return null;
    }
  },
  
  async getAllUsers(token = null) {
    try {
      const baseUrl = await getServiceUrl('auth-service');
      
      // Use internal endpoint for service-to-service communication
      const response = await axios.get(`${baseUrl}/internal/users`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error.message);
      return [];
    }
  },

  async verifyToken(token) {
    try {
      const baseUrl = await getServiceUrl('auth-service');
      const response = await axios.get(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error verifying token:', error.message);
      return null;
    }
  }
};

// Cars Service Client
const carsService = {
  async getVoitureById(voitureId) {
    try {
      const baseUrl = await getServiceUrl('cars-service');
      const response = await axios.get(`${baseUrl}/voitures/${voitureId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching voiture ${voitureId}:`, error.message);
      return null;
    }
  },
  
  async getAllVoitures() {
    try {
      const baseUrl = await getServiceUrl('cars-service');
      const response = await axios.get(`${baseUrl}/voitures`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching voitures:', error.message);
      return [];
    }
  },
  
  async getVoitureByMatricule(matricule) {
    try {
      const baseUrl = await getServiceUrl('cars-service');
      const response = await axios.get(`${baseUrl}/voitures/plate/${matricule}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching voiture by matricule ${matricule}:`, error.message);
      return null;
    }
  },

  async updateVoitureStatus(voitureId, etat, token = null) {
    try {
      const baseUrl = await getServiceUrl('cars-service');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.put(`${baseUrl}/voitures/${voitureId}`, { etat }, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error updating voiture status ${voitureId}:`, error.message);
      return null;
    }
  }
};

module.exports = {
  authService,
  carsService,
  getServiceUrl
};
