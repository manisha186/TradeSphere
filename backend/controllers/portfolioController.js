const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const portfolioService = require('../services/portfolioService');

// @desc    Get user portfolio and current holdings valuations
// @route   GET /api/portfolio
// @access  Private
exports.getPortfolio = async (req, res, next) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user.id }).populate('holdings.stockId');

    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user.id, holdings: [] });
    }

    // Force recalculate to make sure valuations match latest mock simulator ticks
    portfolio = await portfolioService.recalculatePortfolio(portfolio._id);

    // Map holdings to include current stock price and change percentage
    const updatedHoldings = [];
    for (let holding of portfolio.holdings) {
      const stock = await Stock.findById(holding.stockId);
      if (stock) {
        const totalCost = Number((holding.quantity * holding.averageBuyPrice).toFixed(2));
        const currentValue = Number((holding.quantity * stock.currentPrice).toFixed(2));
        const profitLoss = Number((currentValue - totalCost).toFixed(2));
        const roi = totalCost > 0 ? Number(((profitLoss / totalCost) * 100).toFixed(2)) : 0;

        updatedHoldings.push({
          symbol: holding.symbol,
          stockId: holding.stockId,
          quantity: holding.quantity,
          averageBuyPrice: holding.averageBuyPrice,
          currentPrice: stock.currentPrice,
          totalCost,
          currentValue,
          profitLoss,
          roi
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        _id: portfolio._id,
        userId: portfolio.userId,
        totalInvestment: portfolio.totalInvestment,
        currentValue: portfolio.currentValue,
        profitLoss: portfolio.profitLoss,
        holdings: updatedHoldings
      }
    });
  } catch (error) {
    next(error);
  }
};
