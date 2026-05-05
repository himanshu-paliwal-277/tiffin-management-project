const express = require('express');
const router = express.Router();
const { getUsers, addUser, removeUser } = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/adminOnly');

router.get('/', protect, getUsers);
router.post('/', protect, adminOnly, addUser);
router.delete('/:id', protect, adminOnly, removeUser);

module.exports = router;
