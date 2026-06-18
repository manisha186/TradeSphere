const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  averageBuyPrice: {
    type: Number,
    required: true,
    min: [0, 'Average buy price cannot be negative']
  }
}, { _id: false });

const PortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  holdings: [HoldingSchema],
  totalInvestment: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  profitLoss: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', PortfolioSchema);
module.exports = process.env.USE_MOCK_DB === 'true' ? require('../config/mockDb').Portfolio : Portfolio;
