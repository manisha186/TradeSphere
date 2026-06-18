const Stock = require('../models/Stock');
const marketService = require('../services/marketService');

// Helper to compute price changes
const computeChangeStats = (stock) => {
  const history = stock.historicalData;
  if (!history || history.length < 2) {
    return { change: 0, changePercent: 0 };
  }
  // Previous day close (second to last element)
  const prevPrice = history[history.length - 2].price;
  const change = Number((stock.currentPrice - prevPrice).toFixed(2));
  const changePercent = Number(((change / prevPrice) * 100).toFixed(2));
  return { change, changePercent };
};

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Public
exports.getStocks = async (req, res, next) => {
  try {
    const searchQuery = req.query.search || '';
    const dbStocks = await marketService.listStocks(searchQuery);

    const stocks = dbStocks.map(stock => {
      // Fetch stats dynamically since we want yesterday's data
      const fullStock = stock.toObject ? stock : stock; // in case it is plain JSON
      return {
        ...fullStock,
        ...computeChangeStats(stock)
      };
    });

    res.status(200).json({ success: true, count: stocks.length, data: stocks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
exports.getStockBySymbol = async (req, res, next) => {
  try {
    const stock = await marketService.fetchStockQuote(req.params.symbol);
    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock ${req.params.symbol} not found` });
    }

    const stats = computeChangeStats(stock);
    const result = {
      ...stock.toObject(),
      change: stats.change,
      changePercent: stats.changePercent
    };

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock historical data
// @route   GET /api/stocks/:symbol/history
// @access  Public
exports.getStockHistoricalData = async (req, res, next) => {
  try {
    const history = await marketService.fetchHistoricalData(req.params.symbol);
    if (!history || history.length === 0) {
      return res.status(404).json({ success: false, message: `No historical data for ${req.params.symbol}` });
    }
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

// @desc    Get market overview / summary dashboard (gainers, losers, trending)
// @route   GET /api/stocks/market/summary
// @access  Public
exports.getMarketSummary = async (req, res, next) => {
  try {
    const allStocks = await Stock.find();
    
    const stocksWithStats = allStocks.map(stock => {
      const stats = computeChangeStats(stock);
      return {
        _id: stock._id,
        symbol: stock.symbol,
        companyName: stock.companyName,
        currentPrice: stock.currentPrice,
        volume: stock.volume,
        marketCap: stock.marketCap,
        ...stats
      };
    });

    // Sort for top gainers, losers, trending (volume)
    const topGainers = [...stocksWithStats]
      .filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 4);

    const topLosers = [...stocksWithStats]
      .filter(s => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 4);

    const trending = [...stocksWithStats]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 4);

    // Compute simple TradeSphere index overview
    let totalCap = 0;
    let avgGainPercent = 0;
    stocksWithStats.forEach(s => {
      totalCap += s.marketCap;
      avgGainPercent += s.changePercent;
    });
    avgGainPercent = Number((avgGainPercent / stocksWithStats.length).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        topGainers,
        topLosers,
        trending,
        marketStats: {
          totalMarketCap: totalCap,
          indexChangePercent: avgGainPercent,
          totalVolume: stocksWithStats.reduce((sum, s) => sum + s.volume, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
