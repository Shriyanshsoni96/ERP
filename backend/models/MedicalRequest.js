import mongoose from 'mongoose';

const medicalRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  certificateUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  doctorRemark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('MedicalRequest', medicalRequestSchema);

