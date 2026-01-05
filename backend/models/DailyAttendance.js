import mongoose from 'mongoose';

const dailyAttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkInTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  location: {
    type: String, // Can store GPS coordinates or location name
    default: null
  }
}, {
  timestamps: true
});

// Index to prevent duplicate attendance for same user on same date
dailyAttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyAttendance', dailyAttendanceSchema);

