import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import MedicalRequest from '../models/MedicalRequest.js';
import { getInstitutionSummary, answerAdminQuestion } from '../services/gemini.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// Get institution summary
router.get('/dashboard', async (req, res) => {
  try {
    // Get all students
    const students = await User.find({ role: 'student' });
    const studentIds = students.map(s => s._id);

    // Get all classes
    const classes = [...new Set(students.map(s => s.classId).filter(Boolean))];

    // Get attendance data
    const attendanceRecords = await Attendance.find({ studentId: { $in: studentIds } });
    const marksRecords = await Marks.find({ studentId: { $in: studentIds } });

    // Calculate overall statistics
    let totalAttendance = 0;
    let attendanceCount = 0;
    let totalMarks = 0;
    let marksCount = 0;

    for (const student of students) {
      const studentAttendance = attendanceRecords.filter(a => 
        a.studentId.toString() === student._id.toString()
      );
      const studentMarks = marksRecords.filter(m => 
        m.studentId.toString() === student._id.toString()
      );

      if (studentAttendance.length > 0) {
        const avg = studentAttendance.reduce((sum, a) => sum + a.percentage, 0) / studentAttendance.length;
        totalAttendance += avg;
        attendanceCount++;
      }

      if (studentMarks.length > 0) {
        const avg = studentMarks.reduce((sum, m) => sum + m.score, 0) / studentMarks.length;
        totalMarks += avg;
        marksCount++;
      }
    }

    const overallAttendance = attendanceCount > 0 
      ? Math.round(totalAttendance / attendanceCount) 
      : 0;
    const overallPerformance = marksCount > 0 
      ? Math.round(totalMarks / marksCount) 
      : 0;

    // Identify risk areas (classes with low attendance or performance)
    const riskAreas = [];
    const classStats = {};

    for (const classId of classes) {
      const classStudents = students.filter(s => s.classId === classId);
      const classStudentIds = classStudents.map(s => s._id);

      let classAttendance = 0;
      let classAttendanceCount = 0;
      let classMarks = 0;
      let classMarksCount = 0;

      for (const studentId of classStudentIds) {
        const studentAttendance = attendanceRecords.filter(a => 
          a.studentId.toString() === studentId.toString()
        );
        const studentMarks = marksRecords.filter(m => 
          m.studentId.toString() === studentId.toString()
        );

        if (studentAttendance.length > 0) {
          const avg = studentAttendance.reduce((sum, a) => sum + a.percentage, 0) / studentAttendance.length;
          classAttendance += avg;
          classAttendanceCount++;
        }

        if (studentMarks.length > 0) {
          const avg = studentMarks.reduce((sum, m) => sum + m.score, 0) / studentMarks.length;
          classMarks += avg;
          classMarksCount++;
        }
      }

      const avgClassAttendance = classAttendanceCount > 0 
        ? Math.round(classAttendance / classAttendanceCount) 
        : 0;
      const avgClassMarks = classMarksCount > 0 
        ? Math.round(classMarks / classMarksCount) 
        : 0;

      if (avgClassAttendance < 75) {
        riskAreas.push({
          type: 'Low Attendance',
          class: classId,
          value: `${avgClassAttendance}%`
        });
      }

      if (avgClassMarks < 60) {
        riskAreas.push({
          type: 'Low Performance',
          class: classId,
          value: `${avgClassMarks}%`
        });
      }
    }

    // Get medical statistics (count only)
    const medicalStats = {
      pending: await MedicalRequest.countDocuments({ status: 'pending' }),
      approved: await MedicalRequest.countDocuments({ status: 'approved' }),
      rejected: await MedicalRequest.countDocuments({ status: 'rejected' }),
      total: await MedicalRequest.countDocuments()
    };

    // Get AI summary
    const institutionData = {
      overallAttendance,
      overallPerformance,
      totalClasses: classes.length,
      totalStudents: students.length,
      riskAreas
    };

    const aiSummary = await getInstitutionSummary(institutionData);

    res.json({
      overallAttendance,
      overallPerformance,
      totalClasses: classes.length,
      totalStudents: students.length,
      riskAreas,
      medicalStats,
      aiSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// AI Decision Assistant
router.post('/ask-question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // Get institution data
    const students = await User.find({ role: 'student' });
    const studentIds = students.map(s => s._id);
    const attendanceRecords = await Attendance.find({ studentId: { $in: studentIds } });
    const marksRecords = await Marks.find({ studentId: { $in: studentIds } });

    let totalAttendance = 0;
    let attendanceCount = 0;
    let totalMarks = 0;
    let marksCount = 0;

    for (const student of students) {
      const studentAttendance = attendanceRecords.filter(a => 
        a.studentId.toString() === student._id.toString()
      );
      const studentMarks = marksRecords.filter(m => 
        m.studentId.toString() === student._id.toString()
      );

      if (studentAttendance.length > 0) {
        const avg = studentAttendance.reduce((sum, a) => sum + a.percentage, 0) / studentAttendance.length;
        totalAttendance += avg;
        attendanceCount++;
      }

      if (studentMarks.length > 0) {
        const avg = studentMarks.reduce((sum, m) => sum + m.score, 0) / studentMarks.length;
        totalMarks += avg;
        marksCount++;
      }
    }

    const overallAttendance = attendanceCount > 0 
      ? Math.round(totalAttendance / attendanceCount) 
      : 0;
    const overallPerformance = marksCount > 0 
      ? Math.round(totalMarks / marksCount) 
      : 0;

    // Get risk areas (simplified)
    const classes = [...new Set(students.map(s => s.classId).filter(Boolean))];
    const riskAreas = [];

    for (const classId of classes) {
      const classStudents = students.filter(s => s.classId === classId);
      const classStudentIds = classStudents.map(s => s._id);
      const classAttendance = attendanceRecords.filter(a => 
        classStudentIds.some(id => id.toString() === a.studentId.toString())
      );
      
      if (classAttendance.length > 0) {
        const avg = classAttendance.reduce((sum, a) => sum + a.percentage, 0) / classAttendance.length;
        if (avg < 75) {
          riskAreas.push({ type: 'Low Attendance', class: classId, value: `${Math.round(avg)}%` });
        }
      }
    }

    const institutionData = {
      overallAttendance,
      overallPerformance,
      riskAreas
    };

    const answer = await answerAdminQuestion(question, institutionData);

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

