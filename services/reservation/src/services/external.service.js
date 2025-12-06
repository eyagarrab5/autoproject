const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const CARS_SERVICE_URL = process.env.CARS_SERVICE_URL || 'http://localhost:3002';

/**
 * Get user information from auth service
 */
exports.getUserById = async (userId, token) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/users/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error.message);
    return null;
  }
};

/**
 * Get voiture information from cars service
 */
exports.getVoitureById = async (voitureId) => {
  try {
    const response = await axios.get(`${CARS_SERVICE_URL}/voitures/${voitureId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch voiture ${voitureId}:`, error.message);
    return null;
  }
};

/**
 * Get voiture by matricule from cars service
 */
exports.getVoitureByMatricule = async (matricule) => {
  try {
    const response = await axios.get(`${CARS_SERVICE_URL}/voitures/matricule/${matricule}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch voiture by matricule ${matricule}:`, error.message);
    return null;
  }
};

/**
 * Update voiture status in cars service
 */
exports.updateVoitureStatus = async (voitureId, status, token) => {
  try {
    const response = await axios.put(
      `${CARS_SERVICE_URL}/voitures/${voitureId}`,
      { etat: status },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update voiture ${voitureId} status:`, error.message);
    return null;
  }
};

/**
 * Send email notification via auth service or directly
 */
exports.notifyUser = async (userId, subject, message) => {
  try {
    // This could be extended to use a notification service
    console.log(`Notification to user ${userId}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`Failed to notify user ${userId}:`, error.message);
    return false;
  }
};
