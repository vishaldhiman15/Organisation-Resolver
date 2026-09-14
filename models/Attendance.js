import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'left_early', 'out_of_bounds'],
    default: 'present',
  },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  checkInLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  checkOutLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

// Compound index to ensure one check-in per day per user
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
