import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Checkin from '../models/Checkin.js';
import MedicalRequest from '../models/MedicalRequest.js';
import { getStudentSummary } from '../services/gemini.js';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get attendance
    const attendanceRecords = await Attendance.find({ studentId });
    const attendanceBySubject = {};
    let totalAttendance = 0;
    attendanceRecords.forEach(record => {
      if (!attendanceBySubject[record.subject]) {
        attendanceBySubject[record.subject] = [];
      }
      attendanceBySubject[record.subject].push(record.percentage);
      totalAttendance += record.percentage;
    });

    const avgAttendance = attendanceRecords.length > 0 
      ? Math.round(totalAttendance / attendanceRecords.length) 
      : 0;

    // Get marks
    const marksRecords = await Marks.find({ studentId });
    const marksBySubject = {};
    let totalMarks = 0;
    marksRecords.forEach(record => {
      if (!marksBySubject[record.subject]) {
        marksBySubject[record.subject] = [];
      }
      marksBySubject[record.subject].push(record.score);
      totalMarks += record.score;
    });

    const avgMarks = marksRecords.length > 0 
      ? Math.round(totalMarks / marksRecords.length) 
      : 0;

    // Get medical requests
    const medicalRequests = await MedicalRequest.find({ studentId })
      .sort({ createdAt: -1 });

    // Prepare data for AI summary
    const studentData = {
      name: req.user.name,
      attendance: avgAttendance,
      subjects: Object.keys(attendanceBySubject),
      marks: marksBySubject
    };

    // Get AI summary
    const aiSummary = await getStudentSummary(studentData);

    res.json({
      attendance: attendanceBySubject,
      marks: marksBySubject,
      avgAttendance,
      avgMarks,
      medicalRequests,
      aiSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save check-in
router.post('/checkin', async (req, res) => {
  try {
    const { mood, text } = req.body;

    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' });
    }

    const checkin = new Checkin({
      studentId: req.user.id,
      mood,
      text: text || ''
    });

    await checkin.save();
    res.status(201).json({ message: 'Check-in saved successfully', checkin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create medical request
router.post('/medical-request', async (req, res) => {
  try {
    const { fromDate, toDate, reason, certificateUrl } = req.body;

    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const medicalRequest = new MedicalRequest({
      studentId: req.user.id,
      fromDate,
      toDate,
      reason,
      certificateUrl: certificateUrl || null,
      status: 'pending'
    });

    await medicalRequest.save();
    res.status(201).json({ message: 'Medical request submitted successfully', medicalRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get medical requests
router.get('/medical-requests', async (req, res) => {
  try {
    const medicalRequests = await MedicalRequest.find({ studentId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(medicalRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

