const express = require('express');
const router = express.Router();
const {
  getPool,
  initializePool,
  restockTiffins,
  updatePrice,
  updateThreshold,
} = require('../controllers/tiffinController');
const { protect } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/adminOnly');

router.get('/pool', protect, getPool);
router.post('/initialize', protect, adminOnly, initializePool);
router.post('/restock', protect, adminOnly, restockTiffins);
router.patch('/price', protect, adminOnly, updatePrice);
router.patch('/threshold', protect, adminOnly, updateThreshold);

module.exports = router;
