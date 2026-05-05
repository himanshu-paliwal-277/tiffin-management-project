const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/historyController');
const { protect } = require('../middlewares/auth');

router.get('/', protect, getHistory);

module.exports = router;
