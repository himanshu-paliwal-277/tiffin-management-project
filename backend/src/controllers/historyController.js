const History = require('../models/History');

// GET /api/history  — full audit log with filters
const getHistory = async (req, res) => {
  try {
    const { action, userId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.$or = [{ performedBy: userId }, { targetUser: userId }];

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      History.find(filter)
        .populate('performedBy', 'name email')
        .populate('targetUser', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      History.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHistory };
