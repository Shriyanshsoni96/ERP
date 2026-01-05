import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import MedicalRequest from '../models/MedicalRequest.js';
import DailyAttendance from '../models/DailyAttendance.js';
import ActivityLog from '../models/ActivityLog.js';
import { getClassSummary } from '../services/gemini.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('teacher'));

// Get class overview
router.get('/class-overview', async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher || !teacher.classId) {
      return res.status(400).json({ message: 'Teacher not assigned to a class' });
    }

    // Get all students in the class
    const students = await User.find({ 
      role: 'student', 
      classId: teacher.classId 
    });

    const studentIds = students.map(s => s._id);

    // Get attendance data
    const attendanceRecords = await Attendance.find({ studentId: { $in: studentIds } });
    const marksRecords = await Marks.find({ studentId: { $in: studentIds } });

    // Calculate statistics
    let totalAttendance = 0;
    let attendanceCount = 0;
    let totalMarks = 0;
    let marksCount = 0;
    const studentsNeedingAttention = [];

    for (const student of students) {
      const studentAttendance = attendanceRecords.filter(a => 
        a.studentId.toString() === student._id.toString()
      );
      const studentMarks = marksRecords.filter(m => 
        m.studentId.toString() === student._id.toString()
      );

      let avgAttendance = 0;
      if (studentAttendance.length > 0) {
        avgAttendance = studentAttendance.reduce((sum, a) => sum + a.percentage, 0) / studentAttendance.length;
        totalAttendance += avgAttendance;
        attendanceCount++;
      }

      let avgMarks = 0;
      if (studentMarks.length > 0) {
        avgMarks = studentMarks.reduce((sum, m) => sum + m.score, 0) / studentMarks.length;
        totalMarks += avgMarks;
        marksCount++;
      }

      // Check if student needs attention
      const hasMedicalApproval = await MedicalRequest.findOne({
        studentId: student._id,
        status: 'approved',
        fromDate: { $lte: new Date() },
        toDate: { $gte: new Date() }
      });

      if ((avgAttendance < 75 || avgMarks < 60) && !hasMedicalApproval) {
        studentsNeedingAttention.push({
          id: student._id,
          name: student.name,
          email: student.email,
          avgAttendance: Math.round(avgAttendance),
          avgMarks: Math.round(avgMarks),
          hasMedicalApproval: false
        });
      }
    }

    const avgClassAttendance = attendanceCount > 0 
      ? Math.round(totalAttendance / attendanceCount) 
      : 0;
    const avgClassMarks = marksCount > 0 
      ? Math.round(totalMarks / marksCount) 
      : 0;

    // Get AI summary
    const classData = {
      avgAttendance: avgClassAttendance,
      avgMarks: avgClassMarks,
      totalStudents: students.length,
      studentsNeedingAttention: studentsNeedingAttention.length
    };

    const aiSummary = await getClassSummary(classData);

    res.json({
      classId: teacher.classId,
      totalStudents: students.length,
      avgAttendance: avgClassAttendance,
      avgMarks: avgClassMarks,
      studentsNeedingAttention,
      aiSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get students in class
router.get('/students', async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher || !teacher.classId) {
      return res.status(400).json({ message: 'Teacher not assigned to a class' });
    }

    const students = await User.find({ 
      role: 'student', 
      classId: teacher.classId 
    }).select('-password');

    // Add medical approval status
    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        const hasMedicalApproval = await MedicalRequest.findOne({
          studentId: student._id,
          status: 'approved',
          fromDate: { $lte: new Date() },
          toDate: { $gte: new Date() }
        });

        return {
          ...student.toObject(),
          hasMedicalApproval: !!hasMedicalApproval
        };
      })
    );

    res.json(studentsWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update attendance
router.post('/attendance', async (req, res) => {
  try {
    const { studentId, subject, percentage } = req.body;

    if (!studentId || !subject || percentage === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if student is in teacher's class
    const teacher = await User.findById(req.user.id);
    const student = await User.findById(studentId);
    
    if (!student || student.classId !== teacher.classId) {
      return res.status(403).json({ message: 'Student not in your class' });
    }

    // Update or create attendance
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, subject },
      { studentId, subject, percentage },
      { upsert: true, new: true }
    );

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update marks
router.post('/marks', async (req, res) => {
  try {
    const { studentId, subject, score } = req.body;

    if (!studentId || !subject || score === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if student is in teacher's class
    const teacher = await User.findById(req.user.id);
    const student = await User.findById(studentId);
    
    if (!student || student.classId !== teacher.classId) {
      return res.status(403).json({ message: 'Student not in your class' });
    }

    // Update or create marks
    const marks = await Marks.findOneAndUpdate(
      { studentId, subject },
      { studentId, subject, score },
      { upsert: true, new: true }
    );

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      role: 'teacher',
      action: 'update_marks',
      details: { studentId, subject, score },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Marks updated successfully', marks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark daily attendance (check-in) for teachers
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
      role: 'teacher',
      date: today,
      checkInTime: new Date(),
      status
    });

    await attendance.save();

    // Log activity
    await ActivityLog.create({
      userId,
      role: 'teacher',
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

// Get daily attendance history for teacher
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

export default router;

