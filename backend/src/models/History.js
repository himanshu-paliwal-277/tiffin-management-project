const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'TIFFIN_ADDED',       // initial pool creation / restock
        'TIFFIN_CONSUMED',    // daily entry
        'PRICE_UPDATED',      // price per tiffin changed
        'THRESHOLD_UPDATED',  // low alert threshold changed
        'USER_ADDED',         // new member added
        'USER_REMOVED',       // member removed
        'ENTRY_UPDATED',      // daily entry edited
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // flexible object for change data
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('History', historySchema);
