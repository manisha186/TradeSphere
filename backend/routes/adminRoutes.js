const express = require('express');
const router = express.Router();
const { addStock, updateStock, deleteStock, getUsers, getAllTransactions } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes and check for role ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

router.post('/stocks', addStock);
router.put('/stocks/:symbol', updateStock);
router.delete('/stocks/:symbol', deleteStock);
router.get('/users', getUsers);
router.get('/transactions', getAllTransactions);

module.exports = router;
