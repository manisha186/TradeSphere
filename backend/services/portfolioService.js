const mongoose = require('mongoose');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');

/**
 * Recalculate the entire portfolio investment, current value, and profit/loss
 */
const recalculatePortfolio = async (portfolioId) => {
  const portfolio = await Portfolio.findById(portfolioId);
  if (!portfolio) return null;

  let totalInvestment = 0;
  let currentValue = 0;

  for (let holding of portfolio.holdings) {
    const stock = await Stock.findById(holding.stockId);
    if (stock) {
      totalInvestment += holding.quantity * holding.averageBuyPrice;
      currentValue += holding.quantity * stock.currentPrice;
    }
  }

  portfolio.totalInvestment = Number(totalInvestment.toFixed(2));
  portfolio.currentValue = Number(currentValue.toFixed(2));
  portfolio.profitLoss = Number((currentValue - totalInvestment).toFixed(2));

  await portfolio.save();
  return portfolio;
};

/**
 * Execute a BUY stock order
 */
const buyStock = async (userId, symbol, quantity) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() }).session(session);
    if (!stock) throw new Error(`Stock ${symbol} not found`);

    const totalCost = Number((stock.currentPrice * quantity).toFixed(2));

    // Verify virtual balance
    if (user.virtualBalance < totalCost) {
      throw new Error(`Insufficient funds. Required: $${totalCost.toLocaleString()}, Available: $${user.virtualBalance.toLocaleString()}`);
    }

    // Deduct balance
    user.virtualBalance = Number((user.virtualBalance - totalCost).toFixed(2));
    await user.save({ session });

    // Log transaction
    const transaction = await Transaction.create([{
      userId: user._id,
      stockId: stock._id,
      symbol: stock.symbol,
      type: 'BUY',
      quantity,
      price: stock.currentPrice,
      totalAmount: totalCost
    }], { session });

    // Update Portfolio
    let portfolio = await Portfolio.findOne({ userId: user._id }).session(session);
    if (!portfolio) {
      portfolio = new Portfolio({ userId: user._id, holdings: [] });
    }

    const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === stock.symbol);

    if (holdingIndex > -1) {
      // Existing holding - update average buy price and quantity
      const existingHolding = portfolio.holdings[holdingIndex];
      const newQuantity = existingHolding.quantity + quantity;
      
      const totalCostExisting = existingHolding.quantity * existingHolding.averageBuyPrice;
      const newAverageBuyPrice = (totalCostExisting + totalCost) / newQuantity;
      
      existingHolding.quantity = Number(newQuantity.toFixed(4));
      existingHolding.averageBuyPrice = Number(newAverageBuyPrice.toFixed(4));
    } else {
      // New holding
      portfolio.holdings.push({
        stockId: stock._id,
        symbol: stock.symbol,
        quantity,
        averageBuyPrice: stock.currentPrice
      });
    }

    await portfolio.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Recalculate portfolio totals outside the transaction session to ensure safety
    await recalculatePortfolio(portfolio._id);

    return {
      success: true,
      transaction: transaction[0],
      newBalance: user.virtualBalance
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Execute a SELL stock order
 */
const sellStock = async (userId, symbol, quantity) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() }).session(session);
    if (!stock) throw new Error(`Stock ${symbol} not found`);

    let portfolio = await Portfolio.findOne({ userId: user._id }).session(session);
    if (!portfolio) throw new Error('No holdings found. Portfolio empty');

    const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === stock.symbol);
    if (holdingIndex === -1) {
      throw new Error(`You do not own any shares of ${symbol}`);
    }

    const holding = portfolio.holdings[holdingIndex];
    if (holding.quantity < quantity) {
      throw new Error(`Insufficient shares. Owned: ${holding.quantity}, Attempted to sell: ${quantity}`);
    }

    const totalRevenue = Number((stock.currentPrice * quantity).toFixed(2));

    // Increase virtual balance
    user.virtualBalance = Number((user.virtualBalance + totalRevenue).toFixed(2));
    await user.save({ session });

    // Log transaction
    const transaction = await Transaction.create([{
      userId: user._id,
      stockId: stock._id,
      symbol: stock.symbol,
      type: 'SELL',
      quantity,
      price: stock.currentPrice,
      totalAmount: totalRevenue
    }], { session });

    // Update holdings
    if (holding.quantity === quantity) {
      // Sold all shares
      portfolio.holdings.splice(holdingIndex, 1);
    } else {
      // Reduce quantity
      holding.quantity = Number((holding.quantity - quantity).toFixed(4));
    }

    await portfolio.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Recalculate portfolio
    await recalculatePortfolio(portfolio._id);

    return {
      success: true,
      transaction: transaction[0],
      newBalance: user.virtualBalance
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  recalculatePortfolio,
  buyStock,
  sellStock
};
