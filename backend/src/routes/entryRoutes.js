const express = require('express');
const router = express.Router();
const {
  createEntry,
  updateEntry,
  getEntries,
  getMonthlySummary,
  getDailyTrend,
} = require('../controllers/entryController');
const { protect } = require('../middlewares/auth');

router.post('/', protect, createEntry);
router.put('/:id', protect, updateEntry);
router.get('/', protect, getEntries);
router.get('/summary', protect, getMonthlySummary);
router.get('/trend', protect, getDailyTrend);

module.exports = router;
