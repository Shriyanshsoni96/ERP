import mongoose from 'mongoose';

const checkinSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: String,
    enum: ['happy', 'neutral', 'sad', 'anxious', 'excited'],
    required: true
  },
  text: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Checkin', checkinSchema);

