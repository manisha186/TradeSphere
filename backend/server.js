const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Port configurations
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to Database (determines real or mock mode)
  await connectDB();

  // 2. Dynamically require app and services AFTER database state is set
  const app = require('./app');
  const { runPriceSimulator } = require('./services/marketService');

  // Create Server
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`TradeSphere API is ready for requests!`);
  });

  // Start Real-Time Stock Price Simulator (updates price every 15 seconds)
  console.log('Initializing Real-time Stock Price Simulator...');
  const SIMULATOR_INTERVAL_MS = 15000;
  
  // Seed initial mock stocks if we are running in mock database mode
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('Pre-populating In-Memory database with stock assets...');
    try {
      const Stock = require('./models/Stock');
      const User = require('./models/User');
      const Portfolio = require('./models/Portfolio');
      
      // Seed default mock stocks
      const defaultStocks = [
        { symbol: 'AAPL', companyName: 'Apple Inc.', currentPrice: 185.50, description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.', marketCap: 2900000000000, volume: 52000000, dayHigh: 191.00, dayLow: 180.00, historicalData: [] },
        { symbol: 'MSFT', companyName: 'Microsoft Corporation', currentPrice: 420.25, description: 'Microsoft Corporation develops and supports software, services, devices, and solutions.', marketCap: 3120000000000, volume: 23000000, dayHigh: 432.00, dayLow: 410.00, historicalData: [] },
        { symbol: 'GOOGL', companyName: 'Alphabet Inc.', currentPrice: 172.80, description: 'Alphabet Inc. provides search, online advertising, cloud computing, and hardware products.', marketCap: 2150000000000, volume: 28000000, dayHigh: 178.00, dayLow: 168.00, historicalData: [] },
        { symbol: 'AMZN', companyName: 'Amazon.com, Inc.', currentPrice: 180.15, description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions.', marketCap: 1870000000000, volume: 35000000, dayHigh: 185.00, dayLow: 175.00, historicalData: [] },
        { symbol: 'TSLA', companyName: 'Tesla, Inc.', currentPrice: 178.50, description: 'Tesla, Inc. designs, manufactures, and sells electric vehicles, solar energy systems.', marketCap: 568000000000, volume: 88000000, dayHigh: 184.00, dayLow: 172.00, historicalData: [] },
        { symbol: 'NVDA', companyName: 'NVIDIA Corporation', currentPrice: 900.40, description: 'NVIDIA Corporation focuses on personal computer graphics and artificial intelligence.', marketCap: 2250000000000, volume: 45000000, dayHigh: 927.00, dayLow: 873.00, historicalData: [] }
      ];
      
      // Build 30 days of mock history for charts
      const now = new Date();
      defaultStocks.forEach(s => {
        let price = s.currentPrice;
        for (let i = 30; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const changePercent = (Math.random() - 0.49) * 0.05;
          price = Number((price * (1 + changePercent)).toFixed(2));
          s.historicalData.push({ date, price });
        }
      });
      
      await Stock.insertMany(defaultStocks);
      
      // Seed default accounts
      const admin = await User.create({
        name: 'TradeSphere Admin',
        email: 'admin@tradesphere.com',
        password: 'adminpassword',
        role: 'ADMIN',
        virtualBalance: 1000000
      });
      
      const userClient = await User.create({
        name: 'John Doe',
        email: 'user@tradesphere.com',
        password: 'userpassword',
        role: 'USER',
        virtualBalance: 100000
      });
      
      await Portfolio.create({ userId: admin._id, holdings: [] });
      await Portfolio.create({ userId: userClient._id, holdings: [] });
      
      console.log('In-Memory database seeding complete!');
      console.log('  Admin Username: admin@tradesphere.com | Password: adminpassword');
      console.log('  User Username: user@tradesphere.com   | Password: userpassword');
    } catch (seedingError) {
      console.error('Error seeding mock DB:', seedingError);
    }
  }

  setInterval(async () => {
    await runPriceSimulator();
  }, SIMULATOR_INTERVAL_MS);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
