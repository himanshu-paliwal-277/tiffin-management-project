const mongoose = require('mongoose');

const dailyEntrySchema = new mongoose.Schema(
  {
    // whose tiffin was consumed
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // who made this entry (could be different from userId)
    entryBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // stored as YYYY-MM-DD for easy querying
      required: true,
    },
    morning: { type: Number, default: 0, min: 0 },
    night: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// auto-calc total before save
dailyEntrySchema.pre('save', function (next) {
  this.total = this.morning + this.night;
  next();
});

module.exports = mongoose.model('DailyEntry', dailyEntrySchema);
