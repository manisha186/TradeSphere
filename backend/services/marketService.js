const Stock = require('../models/Stock');

/**
 * Service layer for Market Operations.
 * Designed to interface with internal DB or be easily swapped for external APIs
 * like Alpha Vantage, Twelve Data, or Finnhub.
 */

// Swap this flag to connect an external API provider in the future
const USE_EXTERNAL_API = false;

/**
 * Get all available stocks with optional search query
 */
const listStocks = async (searchQuery = '') => {
  if (USE_EXTERNAL_API) {
    // Return external API mapping here
    return [];
  }

  const query = {};
  if (searchQuery) {
    query.$or = [
      { symbol: { $regex: searchQuery, $options: 'i' } },
      { companyName: { $regex: searchQuery, $options: 'i' } }
    ];
  }
  return await Stock.find(query).select('-historicalData');
};

/**
 * Fetch a single stock's details and current quote
 */
const fetchStockQuote = async (symbol) => {
  if (USE_EXTERNAL_API) {
    // Make axios call to Alpha Vantage, Twelve Data, or Finnhub here
    // return formattedQuote;
    return null;
  }
  return await Stock.findOne({ symbol: symbol.toUpperCase() });
};

/**
 * Fetch historical data for charting
 */
const fetchHistoricalData = async (symbol) => {
  if (USE_EXTERNAL_API) {
    // Fetch external chart logs
    return [];
  }
  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() }).select('historicalData');
  return stock ? stock.historicalData : [];
};

/**
 * Simulator function to run in the background.
 * Simulates real-time price ticks by randomly fluctuating stock prices.
 */
const runPriceSimulator = async () => {
  try {
    const stocks = await Stock.find();
    
    for (let stock of stocks) {
      // Fluctuate price by -0.8% to +0.8%
      const changePercent = (Math.random() - 0.495) * 0.016; 
      const oldPrice = stock.currentPrice;
      const newPrice = Number((oldPrice * (1 + changePercent)).toFixed(2));
      
      stock.currentPrice = newPrice;
      
      // Update day high / low
      if (newPrice > stock.dayHigh) stock.dayHigh = newPrice;
      if (newPrice < stock.dayLow) stock.dayLow = newPrice;
      
      // Update volume randomly (adds between 1000 and 50000 shares traded)
      stock.volume += Math.floor(Math.random() * 49000) + 1000;

      // Update the latest historical price index so the real-time chart matches currentPrice
      if (stock.historicalData && stock.historicalData.length > 0) {
        // Update the last element's price to current
        stock.historicalData[stock.historicalData.length - 1].price = newPrice;
      }

      await stock.save();
    }
  } catch (error) {
    console.error(`Simulator Error: ${error.message}`);
  }
};

module.exports = {
  listStocks,
  fetchStockQuote,
  fetchHistoricalData,
  runPriceSimulator
};
