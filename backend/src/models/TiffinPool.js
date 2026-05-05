const mongoose = require('mongoose');

const memberAllocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigned: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
  },
  { _id: false }
);

const tiffinPoolSchema = new mongoose.Schema(
  {
    totalTiffins: { type: Number, default: 0 },
    totalRemaining: { type: Number, default: 0 },
    pricePerTiffin: { type: Number, default: 0 },
    lowAlertThreshold: { type: Number, default: 5 },
    members: [memberAllocationSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TiffinPool', tiffinPoolSchema);
