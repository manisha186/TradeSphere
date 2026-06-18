const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt Mongoose Connection
    // Set a small connection timeout (3 seconds) to fail fast if MongoDB is not running
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tradesphere', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    console.warn('\n========================================================================');
    console.warn('[WARNING] MongoDB connection failed: ' + error.message);
    console.warn('[FALLBACK] TradeSphere is starting with an In-Memory Mock Database!');
    console.warn('[NOTICE] Platform features will be fully functional, but data will reset');
    console.warn('         whenever the Node server process is restarted.');
    console.warn('========================================================================\n');
    
    // Set environment flag to enable mock DB fallback across controllers/services
    process.env.USE_MOCK_DB = 'true';
  }
};

module.exports = connectDB;
