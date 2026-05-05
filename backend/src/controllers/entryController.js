const DailyEntry = require('../models/DailyEntry');
const TiffinPool = require('../models/TiffinPool');
const History = require('../models/History');

// POST /api/entries  — log morning/night consumption
const createEntry = async (req, res) => {
  try {
    const { userId, date, morning, night, note } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ message: 'userId and date are required' });
    }

    const totalConsumed = (morning || 0) + (night || 0);

    if (totalConsumed === 0) {
      return res.status(400).json({ message: 'At least morning or night must be greater than 0' });
    }

    // check pool balance for this user
    const pool = await TiffinPool.findOne();
    if (!pool) {
      return res.status(404).json({ message: 'Tiffin pool not initialized' });
    }

    const member = pool.members.find((m) => m.userId.toString() === userId);
    if (!member) {
      return res.status(404).json({ message: 'User not found in tiffin pool' });
    }

    if (member.remaining < totalConsumed) {
      return res.status(400).json({
        message: `Not enough tiffins. ${member.remaining} remaining but tried to consume ${totalConsumed}`,
      });
    }

    // check if entry already exists for this date
    const existingEntry = await DailyEntry.findOne({ userId, date });
    if (existingEntry) {
      return res.status(400).json({
        message: `Entry for ${date} already exists. Use update endpoint to modify it.`,
      });
    }

    // deduct from pool
    member.remaining -= totalConsumed;
    pool.totalRemaining -= totalConsumed;
    await pool.save();

    const entry = await DailyEntry.create({
      userId,
      entryBy: req.user._id,
      date,
      morning: morning || 0,
      night: night || 0,
      note: note || '',
    });

    await History.create({
      action: 'TIFFIN_CONSUMED',
      performedBy: req.user._id,
      targetUser: userId,
      details: {
        date,
        morning: morning || 0,
        night: night || 0,
        total: totalConsumed,
        remainingAfter: member.remaining,
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/entries/:id  — update an existing entry
const updateEntry = async (req, res) => {
  try {
    const entry = await DailyEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const { morning, night, note } = req.body;
    const newMorning = morning !== undefined ? morning : entry.morning;
    const newNight = night !== undefined ? night : entry.night;
    const newTotal = newMorning + newNight;
    const oldTotal = entry.total;
    const diff = newTotal - oldTotal; // positive = consuming more, negative = consuming less

    if (diff !== 0) {
      const pool = await TiffinPool.findOne();
      const member = pool.members.find((m) => m.userId.toString() === entry.userId.toString());

      if (diff > 0 && member.remaining < diff) {
        return res.status(400).json({
          message: `Not enough tiffins to update. Only ${member.remaining} remaining.`,
        });
      }

      member.remaining -= diff;
      pool.totalRemaining -= diff;
      await pool.save();
    }

    const oldData = { morning: entry.morning, night: entry.night, total: entry.total };

    entry.morning = newMorning;
    entry.night = newNight;
    if (note !== undefined) entry.note = note;
    await entry.save();

    await History.create({
      action: 'ENTRY_UPDATED',
      performedBy: req.user._id,
      targetUser: entry.userId,
      details: {
        date: entry.date,
        before: oldData,
        after: { morning: newMorning, night: newNight, total: newTotal },
      },
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/entries  — list entries with filters
const getEntries = async (req, res) => {
  try {
    const { userId, month, year, date } = req.query;

    const filter = {};

    if (userId) filter.userId = userId;

    if (date) {
      filter.date = date;
    } else if (month && year) {
      // match YYYY-MM prefix
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      filter.date = { $regex: `^${prefix}` };
    } else if (year) {
      filter.date = { $regex: `^${year}` };
    }

    const entries = await DailyEntry.find(filter)
      .populate('userId', 'name email')
      .populate('entryBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/entries/summary  — monthly summary per user for charts
const getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'month and year are required' });
    }

    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    const summary = await DailyEntry.aggregate([
      { $match: { date: { $regex: `^${prefix}` } } },
      {
        $group: {
          _id: '$userId',
          totalConsumed: { $sum: '$total' },
          totalMorning: { $sum: '$morning' },
          totalNight: { $sum: '$night' },
          daysWithEntry: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalConsumed: 1,
          totalMorning: 1,
          totalNight: 1,
          daysWithEntry: 1,
        },
      },
    ]);

    // attach price for cost calculation
    const pool = await TiffinPool.findOne();
    const price = pool ? pool.pricePerTiffin : 0;

    const result = summary.map((s) => ({
      ...s,
      totalCost: s.totalConsumed * price,
      pricePerTiffin: price,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/entries/daily-trend  — last N days for chart
const getDailyTrend = async (req, res) => {
  try {
    const { userId, days = 30 } = req.query;

    const dateList = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateList.push(d.toISOString().split('T')[0]);
    }

    const filter = { date: { $in: dateList } };
    if (userId) filter.userId = userId;

    const entries = await DailyEntry.find(filter).populate('userId', 'name');

    // group by date
    const trend = dateList.map((date) => {
      const dayEntries = entries.filter((e) => e.date === date);
      return {
        date,
        total: dayEntries.reduce((sum, e) => sum + e.total, 0),
        morning: dayEntries.reduce((sum, e) => sum + e.morning, 0),
        night: dayEntries.reduce((sum, e) => sum + e.night, 0),
      };
    });

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEntry, updateEntry, getEntries, getMonthlySummary, getDailyTrend };
