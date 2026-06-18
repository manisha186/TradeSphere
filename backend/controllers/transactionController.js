const Transaction = require('../models/Transaction');
const portfolioService = require('../services/portfolioService');

// @desc    Get all transactions for current user
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute a BUY or SELL order
// @route   POST /api/transactions/order
// @access  Private
exports.executeOrder = async (req, res, next) => {
  try {
    const { symbol, quantity, type } = req.body;

    if (!symbol || !quantity || !type) {
      return res.status(400).json({ success: false, message: 'Please provide symbol, quantity and type (BUY/SELL)' });
    }

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    let result;
    if (type.toUpperCase() === 'BUY') {
      result = await portfolioService.buyStock(req.user.id, symbol, parsedQuantity);
    } else if (type.toUpperCase() === 'SELL') {
      result = await portfolioService.sellStock(req.user.id, symbol, parsedQuantity);
    } else {
      return res.status(400).json({ success: false, message: "Type must be either 'BUY' or 'SELL'" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
