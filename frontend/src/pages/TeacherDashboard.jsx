import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../utils/axios';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({ subject: '', percentage: '' });
  const [marksForm, setMarksForm] = useState({ subject: '', score: '' });
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [canMarkAttendance, setCanMarkAttendance] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchStudents();
    checkAttendanceStatus();
    fetchAttendanceHistory();
    
    const interval = setInterval(() => {
      checkAttendanceStatus();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const checkAttendanceStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const isSchoolHours = hour >= 8 && hour < 17;
    setCanMarkAttendance(isSchoolHours);
  };

  const fetchAttendanceHistory = async () => {
    try {
      const response = await api.get('/teacher/daily-attendance');
      setAttendanceHistory(response.data);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAttendance = response.data.find(a => {
        const attDate = new Date(a.date);
        attDate.setHours(0, 0, 0, 0);
        return attDate.getTime() === today.getTime();
      });
      setAttendanceStatus(todayAttendance);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      const response = await api.post('/teacher/mark-attendance');
      alert('Attendance marked successfully!');
      setAttendanceStatus(response.data.attendance);
      fetchAttendanceHistory();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/teacher/class-overview');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/teacher/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await api.post('/teacher/attendance', {
        studentId: selectedStudent,
        subject: attendanceForm.subject,
        percentage: parseFloat(attendanceForm.percentage)
      });
      setAttendanceForm({ subject: '', percentage: '' });
      setSelectedStudent(null);
      alert('Attendance updated successfully!');
      fetchDashboardData();
      fetchStudents();
    } catch (error) {
      alert('Failed to update attendance');
    }
  };

  const handleMarksSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await api.post('/teacher/marks', {
        studentId: selectedStudent,
        subject: marksForm.subject,
        score: parseFloat(marksForm.score)
      });
      setMarksForm({ subject: '', score: '' });
      setSelectedStudent(null);
      alert('Marks updated successfully!');
      fetchDashboardData();
      fetchStudents();
    } catch (error) {
      alert('Failed to update marks');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  EduOS
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Teacher Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex space-x-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            My Attendance
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👨‍🏫</h2>
                <p className="text-green-100 text-lg">Class: {data?.classId || 'Not Assigned'}</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {data?.totalStudents || 0}
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Total Students</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">In your class</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {data?.avgAttendance || 0}%
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Avg Attendance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">Class average</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {data?.avgMarks || 0}%
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Avg Marks</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">Class performance</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {data?.studentsNeedingAttention?.length || 0}
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Need Attention</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">Students flagged</p>
              </div>
            </div>

            {/* AI Summary */}
            {data?.aiSummary && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Class Insights</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{data.aiSummary}</p>
              </div>
            )}

            {/* Daily Attendance Quick Action */}
            {canMarkAttendance && (
              <div className={`rounded-2xl shadow-xl p-6 mb-8 border-2 ${
                attendanceStatus 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                {attendanceStatus ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">✓ Attendance Marked</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Status: <span className="font-semibold capitalize">{attendanceStatus.status}</span> • 
                        Check-in: {new Date(attendanceStatus.checkInTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mark Your Attendance</h3>
                      <p className="text-gray-600 dark:text-gray-400">Click the button to mark your attendance for today</p>
                    </div>
                    <button
                      onClick={handleMarkAttendance}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Mark Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Students Needing Attention */}
            {data?.studentsNeedingAttention && data.studentsNeedingAttention.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  Students Needing Attention
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.studentsNeedingAttention.map((student) => (
                    <div key={student.id} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 hover:scale-105 transition-transform">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">{student.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Attendance: <span className="font-semibold">{student.avgAttendance}%</span> | 
                            Marks: <span className="font-semibold">{student.avgMarks}%</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* All Students */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                All Students ({students.length})
              </h2>
              {students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <div
                      key={student._id}
                      onClick={() => setSelectedStudent(student._id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                        selectedStudent === student._id
                          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-400 dark:border-blue-600 shadow-lg'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{student.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{student.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          student.hasMedicalApproval
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {student.hasMedicalApproval ? '✓ Medical' : 'No Medical'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No students in your class</p>
              )}
            </div>

            {/* Update Forms */}
            {selectedStudent && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Update Attendance */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Update Attendance
                  </h2>
                  <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                      <input
                        type="text"
                        value={attendanceForm.subject}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, subject: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Percentage</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={attendanceForm.percentage}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, percentage: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="0-100"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Update Attendance
                    </button>
                  </form>
                </div>

                {/* Update Marks */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Update Marks
                  </h2>
                  <form onSubmit={handleMarksSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                      <input
                        type="text"
                        value={marksForm.subject}
                        onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Score</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={marksForm.score}
                        onChange={(e) => setMarksForm({ ...marksForm, score: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="0-100"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Update Marks
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Attendance History */}
            {attendanceHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Attendance History</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attendanceHistory.slice(0, 12).map((attendance) => (
                    <div
                      key={attendance._id}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        attendance.status === 'present'
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                          : attendance.status === 'late'
                          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {new Date(attendance.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          attendance.status === 'present'
                            ? 'bg-green-500 text-white'
                            : attendance.status === 'late'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {attendance.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(attendance.checkInTime).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
