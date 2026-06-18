const express = require('express');
const router = express.Router();
const { getTransactions, executeOrder } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTransactions);
router.post('/order', protect, executeOrder);

module.exports = router;
