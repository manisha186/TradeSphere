const mongoose = require('mongoose');

const HistoricalDataSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

const StockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Please provide a stock symbol'],
    unique: true,
    uppercase: true,
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Please provide a company name'],
    trim: true
  },
  currentPrice: {
    type: Number,
    required: [true, 'Please provide current price']
  },
  dayHigh: {
    type: Number,
    default: 0
  },
  dayLow: {
    type: Number,
    default: 0
  },
  volume: {
    type: Number,
    default: 0
  },
  marketCap: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  historicalData: [HistoricalDataSchema]
}, { timestamps: true });

const Stock = mongoose.model('Stock', StockSchema);
module.exports = process.env.USE_MOCK_DB === 'true' ? require('../config/mockDb').Stock : Stock;
