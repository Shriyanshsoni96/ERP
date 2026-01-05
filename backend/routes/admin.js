import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import MedicalRequest from '../models/MedicalRequest.js';
import DailyAttendance from '../models/DailyAttendance.js';
import ActivityLog from '../models/ActivityLog.js';
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

// Get all users (students, teachers, doctors, admins)
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query; // Optional filter by role
    
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    // Group users by role
    const groupedUsers = {
      students: users.filter(u => u.role === 'student'),
      teachers: users.filter(u => u.role === 'teacher'),
      doctors: users.filter(u => u.role === 'doctor'),
      admins: users.filter(u => u.role === 'admin')
    };
    
    res.json({
      users,
      groupedUsers,
      counts: {
        total: users.length,
        students: groupedUsers.students.length,
        teachers: groupedUsers.teachers.length,
        doctors: groupedUsers.doctors.length,
        admins: groupedUsers.admins.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all activity logs (monitor all user activities)
router.get('/activities', async (req, res) => {
  try {
    const { role, userId, limit = 100 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (userId) query.userId = userId;
    
    const activities = await ActivityLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Group by role
    const groupedActivities = {
      students: activities.filter(a => a.role === 'student'),
      teachers: activities.filter(a => a.role === 'teacher'),
      doctors: activities.filter(a => a.role === 'doctor'),
      admins: activities.filter(a => a.role === 'admin')
    };
    
    res.json({
      activities,
      groupedActivities,
      counts: {
        total: activities.length,
        students: groupedActivities.students.length,
        teachers: groupedActivities.teachers.length,
        doctors: groupedActivities.doctors.length,
        admins: groupedActivities.admins.length
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create student with studentId
router.post('/create-student', async (req, res) => {
  try {
    const { name, email, studentId, classId, password } = req.body;

    if (!name || !email || !studentId) {
      return res.status(400).json({ message: 'Name, email, and studentId are required' });
    }

    // Check if studentId already exists
    const existingStudentId = await User.findOne({ studentId: studentId.trim() });
    if (existingStudentId) {
      return res.status(400).json({ message: 'Student ID already allocated to another student' });
    }

    // Check if email already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create student (password is optional, can be set later)
    const defaultPassword = password || 'student123'; // Default password
    const user = new User({
      name,
      email: normalizedEmail,
      password: defaultPassword,
      role: 'student',
      studentId: studentId.trim(),
      classId: classId || null
    });

    await user.save();

    res.status(201).json({
      message: 'Student created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        classId: user.classId
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student ID or email already exists' });
    }
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign/Update studentId for existing student
router.put('/assign-student-id/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    // Check if studentId is already assigned to another student
    const existingStudent = await User.findOne({ 
      studentId: studentId.trim(),
      _id: { $ne: userId }
    });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID already allocated to another student' });
    }

    // Update studentId
    user.studentId = studentId.trim();
    await user.save();

    res.json({
      message: 'Student ID assigned successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        classId: user.classId
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }
    console.error('Error assigning student ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get daily attendance overview
router.get('/attendance-overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendance = await DailyAttendance.find({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('userId', 'name email role classId');
    
    const studentsPresent = todayAttendance.filter(a => a.role === 'student' && a.status === 'present').length;
    const studentsLate = todayAttendance.filter(a => a.role === 'student' && a.status === 'late').length;
    const teachersPresent = todayAttendance.filter(a => a.role === 'teacher' && a.status === 'present').length;
    const teachersLate = todayAttendance.filter(a => a.role === 'teacher' && a.status === 'late').length;
    
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    
    res.json({
      today: {
        students: {
          present: studentsPresent,
          late: studentsLate,
          absent: totalStudents - studentsPresent - studentsLate,
          total: totalStudents
        },
        teachers: {
          present: teachersPresent,
          late: teachersLate,
          absent: totalTeachers - teachersPresent - teachersLate,
          total: totalTeachers
        }
      },
      attendanceRecords: todayAttendance
    });
  } catch (error) {
    console.error('Error fetching attendance overview:', error);
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

