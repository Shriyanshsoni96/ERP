import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Checkin from '../models/Checkin.js';
import MedicalRequest from '../models/MedicalRequest.js';
import DailyAttendance from '../models/DailyAttendance.js';
import ActivityLog from '../models/ActivityLog.js';
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

// Mark daily attendance (check-in)
router.post('/mark-attendance', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked attendance today
    const existingAttendance = await DailyAttendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    // Check if it's school hours (8 AM - 5 PM)
    const currentHour = new Date().getHours();
    const isSchoolHours = currentHour >= 8 && currentHour < 17;

    if (!isSchoolHours) {
      return res.status(400).json({ message: 'Attendance can only be marked during school hours (8 AM - 5 PM)' });
    }

    // Determine if late (after 9 AM)
    const status = currentHour > 9 ? 'late' : 'present';

    const attendance = new DailyAttendance({
      userId,
      role: 'student',
      date: today,
      checkInTime: new Date(),
      status
    });

    await attendance.save();

    // Log activity
    await ActivityLog.create({
      userId,
      role: 'student',
      action: 'mark_attendance',
      details: { status, checkInTime: attendance.checkInTime },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get daily attendance history
router.get('/daily-attendance', async (req, res) => {
  try {
    const attendance = await DailyAttendance.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// AI Chatbot - Ask questions and get guidance
router.post('/chatbot', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // Get student data for context
    const student = await User.findById(req.user.id);
    const attendanceRecords = await Attendance.find({ studentId: req.user.id });
    const marksRecords = await Marks.find({ studentId: req.user.id });

    let avgAttendance = 0;
    if (attendanceRecords.length > 0) {
      avgAttendance = Math.round(
        attendanceRecords.reduce((sum, a) => sum + a.percentage, 0) / attendanceRecords.length
      );
    }

    let avgMarks = 0;
    const subjects = [];
    if (marksRecords.length > 0) {
      const marksBySubject = {};
      marksRecords.forEach(record => {
        if (!marksBySubject[record.subject]) {
          marksBySubject[record.subject] = [];
          subjects.push(record.subject);
        }
        marksBySubject[record.subject].push(record.score);
      });
      avgMarks = Math.round(
        marksRecords.reduce((sum, m) => sum + m.score, 0) / marksRecords.length
      );
    }

    const studentData = {
      name: student.name,
      attendance: avgAttendance,
      marks: avgMarks,
      subjects: subjects
    };

    const { answerStudentQuestion } = await import('../services/gemini.js');
    const answer = await answerStudentQuestion(question, studentData);

    res.json({ answer });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

