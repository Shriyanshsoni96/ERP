import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import MedicalRequest from '../models/MedicalRequest.js';
import User from '../models/User.js';
import { summarizeMedicalRequest } from '../services/gemini.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('doctor'));

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const pending = await MedicalRequest.countDocuments({ status: 'pending' });
    const approved = await MedicalRequest.countDocuments({ status: 'approved' });
    const rejected = await MedicalRequest.countDocuments({ status: 'rejected' });

    res.json({
      pending,
      approved,
      rejected,
      total: pending + approved + rejected
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all medical requests
router.get('/medical-requests', async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = status ? { status } : {};
    const requests = await MedicalRequest.find(query)
      .populate('studentId', 'name email classId')
      .sort({ createdAt: -1 });

    // Add AI summary for each request
    const requestsWithSummary = await Promise.all(
      requests.map(async (request) => {
        const summary = await summarizeMedicalRequest(request.reason);
        return {
          ...request.toObject(),
          aiSummary: summary
        };
      })
    );

    res.json(requestsWithSummary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single medical request
router.get('/medical-requests/:id', async (req, res) => {
  try {
    const request = await MedicalRequest.findById(req.params.id)
      .populate('studentId', 'name email classId');
    
    if (!request) {
      return res.status(404).json({ message: 'Medical request not found' });
    }

    const summary = await summarizeMedicalRequest(request.reason);

    res.json({
      ...request.toObject(),
      aiSummary: summary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve medical request
router.post('/medical-requests/:id/approve', async (req, res) => {
  try {
    const { doctorRemark } = req.body;

    const request = await MedicalRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        doctorRemark: doctorRemark || ''
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Medical request not found' });
    }

    res.json({ message: 'Medical request approved', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject medical request
router.post('/medical-requests/:id/reject', async (req, res) => {
  try {
    const { doctorRemark } = req.body;

    const request = await MedicalRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        doctorRemark: doctorRemark || ''
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Medical request not found' });
    }

    res.json({ message: 'Medical request rejected', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

