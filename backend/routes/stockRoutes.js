const express = require('express');
const router = express.Router();
const { getStocks, getStockBySymbol, getStockHistoricalData, getMarketSummary } = require('../controllers/stockController');

router.get('/', getStocks);
router.get('/market/summary', getMarketSummary);
router.get('/:symbol', getStockBySymbol);
router.get('/:symbol/history', getStockHistoricalData);

module.exports = router;
