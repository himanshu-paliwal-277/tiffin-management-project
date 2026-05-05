const TiffinPool = require('../models/TiffinPool');
const User = require('../models/User');
const History = require('../models/History');

// GET /api/tiffin/pool  — dashboard data
const getPool = async (req, res) => {
  try {
    const pool = await TiffinPool.findOne().populate('members.userId', 'name email');

    if (!pool) {
      return res.status(404).json({ message: 'Tiffin pool not found. Ask owner to initialize.' });
    }

    const threshold = pool.lowAlertThreshold;

    const membersWithAlert = pool.members.map((m) => ({
      userId: m.userId,
      assigned: m.assigned,
      remaining: m.remaining,
      isLow: m.remaining <= threshold,
      estimatedCost: m.assigned * pool.pricePerTiffin,
    }));

    res.json({
      totalTiffins: pool.totalTiffins,
      totalRemaining: pool.totalRemaining,
      pricePerTiffin: pool.pricePerTiffin,
      lowAlertThreshold: pool.lowAlertThreshold,
      isGroupLow: pool.totalRemaining <= threshold,
      members: membersWithAlert,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tiffin/initialize  — create the pool for the first time (owner only)
const initializePool = async (req, res) => {
  try {
    const existing = await TiffinPool.findOne();
    if (existing) {
      return res.status(400).json({ message: 'Pool already exists. Use /restock to add more.' });
    }

    const { pricePerTiffin, lowAlertThreshold, members } = req.body;
    // members: [{ userId, assigned }]

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'members array is required' });
    }

    const totalTiffins = members.reduce((sum, m) => sum + m.assigned, 0);

    const memberAllocs = members.map((m) => ({
      userId: m.userId,
      assigned: m.assigned,
      remaining: m.assigned,
    }));

    const pool = await TiffinPool.create({
      totalTiffins,
      totalRemaining: totalTiffins,
      pricePerTiffin: pricePerTiffin || 0,
      lowAlertThreshold: lowAlertThreshold || 5,
      members: memberAllocs,
    });

    await History.create({
      action: 'TIFFIN_ADDED',
      performedBy: req.user._id,
      details: {
        type: 'initial',
        totalTiffins,
        pricePerTiffin,
        members: members,
      },
    });

    res.status(201).json(pool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tiffin/restock  — add more tiffins (owner only)
const restockTiffins = async (req, res) => {
  try {
    const pool = await TiffinPool.findOne();
    if (!pool) {
      return res.status(404).json({ message: 'Pool not initialized yet' });
    }

    const { members } = req.body;
    // members: [{ userId, add }]  — how much to add per person

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'members array with add amounts is required' });
    }

    const totalAdded = members.reduce((sum, m) => sum + m.add, 0);

    for (const m of members) {
      const existing = pool.members.find((pm) => pm.userId.toString() === m.userId);
      if (existing) {
        existing.assigned += m.add;
        existing.remaining += m.add;
      }
    }

    pool.totalTiffins += totalAdded;
    pool.totalRemaining += totalAdded;
    await pool.save();

    await History.create({
      action: 'TIFFIN_ADDED',
      performedBy: req.user._id,
      details: {
        type: 'restock',
        totalAdded,
        members,
      },
    });

    res.json({ message: `${totalAdded} tiffins added successfully`, pool });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tiffin/price  — update price per tiffin (owner only)
const updatePrice = async (req, res) => {
  try {
    const { pricePerTiffin } = req.body;

    if (pricePerTiffin === undefined || pricePerTiffin < 0) {
      return res.status(400).json({ message: 'Valid pricePerTiffin is required' });
    }

    const pool = await TiffinPool.findOne();
    if (!pool) {
      return res.status(404).json({ message: 'Pool not found' });
    }

    const oldPrice = pool.pricePerTiffin;
    pool.pricePerTiffin = pricePerTiffin;
    await pool.save();

    await History.create({
      action: 'PRICE_UPDATED',
      performedBy: req.user._id,
      details: { oldPrice, newPrice: pricePerTiffin },
    });

    res.json({ message: 'Price updated', pricePerTiffin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tiffin/threshold  — update low alert threshold (owner only)
const updateThreshold = async (req, res) => {
  try {
    const { lowAlertThreshold } = req.body;

    if (lowAlertThreshold === undefined || lowAlertThreshold < 1) {
      return res.status(400).json({ message: 'Valid lowAlertThreshold is required' });
    }

    const pool = await TiffinPool.findOne();
    if (!pool) {
      return res.status(404).json({ message: 'Pool not found' });
    }

    const oldThreshold = pool.lowAlertThreshold;
    pool.lowAlertThreshold = lowAlertThreshold;
    await pool.save();

    await History.create({
      action: 'THRESHOLD_UPDATED',
      performedBy: req.user._id,
      details: { oldThreshold, newThreshold: lowAlertThreshold },
    });

    res.json({ message: 'Threshold updated', lowAlertThreshold });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPool, initializePool, restockTiffins, updatePrice, updateThreshold };
