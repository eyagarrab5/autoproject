const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/reservationdb');
    console.log(`Reservation Service: MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Reservation Service: Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
