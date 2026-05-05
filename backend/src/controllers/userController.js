const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TiffinPool = require('../models/TiffinPool');
const History = require('../models/History');

// GET /api/users  — all active members
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users  — owner adds a new member
const addUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({ name, email, password, role: 'member' });

    // add this user to the tiffin pool with 0 allocation
    const pool = await TiffinPool.findOne();
    if (pool) {
      pool.members.push({ userId: user._id, assigned: 0, remaining: 0 });
      await pool.save();
    }

    await History.create({
      action: 'USER_ADDED',
      performedBy: req.user._id,
      targetUser: user._id,
      details: { name: user.name, email: user.email },
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/:id  — owner removes a member
const removeUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'owner') {
      return res.status(400).json({ message: 'Cannot remove the owner' });
    }

    // soft delete
    user.isActive = false;
    await user.save();

    // remove from tiffin pool members
    const pool = await TiffinPool.findOne();
    if (pool) {
      const member = pool.members.find((m) => m.userId.toString() === user._id.toString());
      if (member) {
        pool.totalRemaining -= member.remaining;
        pool.members = pool.members.filter((m) => m.userId.toString() !== user._id.toString());
        await pool.save();
      }
    }

    await History.create({
      action: 'USER_REMOVED',
      performedBy: req.user._id,
      targetUser: user._id,
      details: { name: user.name, email: user.email },
    });

    res.json({ message: `${user.name} has been removed from the group` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, addUser, removeUser };
