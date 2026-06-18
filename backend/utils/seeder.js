const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

dotenv.config();

const defaultStocks = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    currentPrice: 185.50,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    marketCap: 2900000000000,
    volume: 52000000
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    currentPrice: 420.25,
    description: 'Microsoft Corporation develops and supports software, services, devices, and solutions worldwide, known for Windows, Office, and Azure Cloud.',
    marketCap: 3120000000000,
    volume: 23000000
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    currentPrice: 172.80,
    description: 'Alphabet Inc. provides search, online advertising, cloud computing, and hardware products globally through Google Services and Google Cloud.',
    marketCap: 2150000000000,
    volume: 28000000
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    currentPrice: 180.15,
    description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
    marketCap: 1870000000000,
    volume: 35000000
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla, Inc.',
    currentPrice: 178.50,
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
    marketCap: 568000000000,
    volume: 88000000
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    currentPrice: 900.40,
    description: 'NVIDIA Corporation focuses on personal computer graphics, graphics processing units, and also artificial intelligence solutions.',
    marketCap: 2250000000000,
    volume: 45000000
  },
  {
    symbol: 'NFLX',
    companyName: 'Netflix, Inc.',
    currentPrice: 610.50,
    description: 'Netflix, Inc. provides entertainment services with paid memberships in approximately 190 countries, offering TV series, documentaries, and feature films.',
    marketCap: 264000000000,
    volume: 4000000
  },
  {
    symbol: 'META',
    companyName: 'Meta Platforms, Inc.',
    currentPrice: 475.20,
    description: 'Meta Platforms, Inc. focuses on building products that enable people to connect and share through mobile devices, personal computers, virtual reality headsets.',
    marketCap: 1210000000000,
    volume: 18000000
  }
];

// Helper to generate 30 days of historical data using random walk
const generateHistoricalData = (basePrice) => {
  const data = [];
  let price = basePrice;
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(16, 0, 0, 0); // Close price of that day

    // Random walk: change between -2.5% and +2.5%
    const changePercent = (Math.random() - 0.49) * 0.05; 
    price = Number((price * (1 + changePercent)).toFixed(2));
    
    data.push({ date, price });
  }
  return data;
};

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tradesphere');

    console.log('Clearing database tables...');
    await Stock.deleteMany();
    await User.deleteMany();
    await Portfolio.deleteMany();
    await Transaction.deleteMany();

    console.log('Seeding stock documents with historical data...');
    const seededStocks = defaultStocks.map(stock => {
      const historicalData = generateHistoricalData(stock.currentPrice);
      // Let's set dayHigh and dayLow relative to current price
      const dayHigh = Number((stock.currentPrice * 1.03).toFixed(2));
      const dayLow = Number((stock.currentPrice * 0.97).toFixed(2));
      return {
        ...stock,
        dayHigh,
        dayLow,
        historicalData
      };
    });

    await Stock.insertMany(seededStocks);
    console.log('Stocks seeded successfully!');

    console.log('Seeding admin and standard user accounts...');
    
    // Seed Admin
    const adminUser = await User.create({
      name: 'TradeSphere Admin',
      email: 'admin@tradesphere.com',
      password: 'adminpassword',
      role: 'ADMIN',
      virtualBalance: 1000000 // Admin gets $1M virtual
    });

    // Seed Normal User
    const normalUser = await User.create({
      name: 'John Doe',
      email: 'user@tradesphere.com',
      password: 'userpassword',
      role: 'USER',
      virtualBalance: 100000 // User gets $100K virtual
    });

    // Create empty portfolios
    await Portfolio.create({ userId: adminUser._id, holdings: [] });
    await Portfolio.create({ userId: normalUser._id, holdings: [] });

    console.log('Database Seeding Completed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error during data import: ${error.message}`);
    process.exit(1);
  }
};

importData();
