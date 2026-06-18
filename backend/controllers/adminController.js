const Stock = require('../models/Stock');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Add a new stock
// @route   POST /api/admin/stocks
// @access  Private/Admin
exports.addStock = async (req, res, next) => {
  try {
    const { symbol, companyName, currentPrice, description, marketCap, volume } = req.body;

    if (!symbol || !companyName || !currentPrice) {
      return res.status(400).json({ success: false, message: 'Please provide symbol, company name and current price' });
    }

    const stockExists = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (stockExists) {
      return res.status(400).json({ success: false, message: `Stock with symbol ${symbol} already exists` });
    }

    // Set initial historical closing data for the past 30 days based on starting price
    const historicalData = [];
    const now = new Date();
    let price = parseFloat(currentPrice);
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(16, 0, 0, 0);

      // Fluctuating historical data points
      const changePercent = (Math.random() - 0.49) * 0.04;
      price = Number((price * (1 + changePercent)).toFixed(2));
      historicalData.push({ date, price });
    }

    const stock = await Stock.create({
      symbol: symbol.toUpperCase(),
      companyName,
      currentPrice: parseFloat(currentPrice),
      dayHigh: parseFloat(currentPrice),
      dayLow: parseFloat(currentPrice),
      description,
      marketCap: parseFloat(marketCap) || 0,
      volume: parseInt(volume) || 0,
      historicalData
    });

    res.status(201).json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock details
// @route   PUT /api/admin/stocks/:symbol
// @access  Private/Admin
exports.updateStock = async (req, res, next) => {
  try {
    const { companyName, currentPrice, description, marketCap, volume } = req.body;
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });

    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock ${req.params.symbol} not found` });
    }

    if (companyName) stock.companyName = companyName;
    if (description) stock.description = description;
    if (marketCap) stock.marketCap = parseFloat(marketCap);
    if (volume) stock.volume = parseInt(volume);
    
    if (currentPrice) {
      const newPrice = parseFloat(currentPrice);
      stock.currentPrice = newPrice;
      if (newPrice > stock.dayHigh) stock.dayHigh = newPrice;
      if (newPrice < stock.dayLow) stock.dayLow = newPrice;
    }

    await stock.save();
    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a stock
// @route   DELETE /api/admin/stocks/:symbol
// @access  Private/Admin
exports.deleteStock = async (req, res, next) => {
  try {
    const stock = await Stock.findOneAndDelete({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock ${req.params.symbol} not found` });
    }
    res.status(200).json({ success: true, message: `Stock ${req.params.symbol} deleted successfully` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin view)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions (Admin view)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .populate('stockId', 'companyName')
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    next(error);
  }
};
