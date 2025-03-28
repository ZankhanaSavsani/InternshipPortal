const mongoose = require('mongoose');
require('dotenv').config();

// Connection options
const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

let retryAttempts = 3;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    console.log(`✅ MongoDB Connected`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB Reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB Connection Closed');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);

    if (retryAttempts > 0) {
      retryAttempts--;
      const backoffTime = Math.pow(2, 3 - retryAttempts) * 1000; // Exponential backoff
      console.log(`🔄 Retrying in ${backoffTime / 1000}s... (${retryAttempts} attempts left)`);
      setTimeout(async () => await connectDB(), backoffTime);
    } else {
      console.error('🚨 Maximum retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
