import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../utils/axios';
import AIChatbot from '../components/AIChatbot';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkinMood, setCheckinMood] = useState('');
  const [checkinText, setCheckinText] = useState('');
  const [medicalForm, setMedicalForm] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    certificateUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [canMarkAttendance, setCanMarkAttendance] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
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
      const response = await api.get('/student/daily-attendance');
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
      const response = await api.post('/student/mark-attendance');
      alert('Attendance marked successfully!');
      setAttendanceStatus(response.data.attendance);
      fetchAttendanceHistory();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/student/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!checkinMood) return;

    try {
      await api.post('/student/checkin', { mood: checkinMood, text: checkinText });
      setCheckinMood('');
      setCheckinText('');
      alert('Check-in saved successfully!');
    } catch (error) {
      alert('Failed to save check-in');
    }
  };

  const handleMedicalRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/student/medical-request', medicalForm);
      setMedicalForm({ fromDate: '', toDate: '', reason: '', certificateUrl: '' });
      alert('Medical request submitted successfully!');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to submit medical request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  EduOS
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
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
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('academics')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'academics'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Academics
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'medical'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Medical
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
                <p className="text-purple-100 text-lg">Here's your academic overview</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {data?.avgAttendance || 0}%
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Average Attendance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">Keep up the great work!</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {data?.avgMarks || 0}%
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Average Marks</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">Excellent performance!</p>
              </div>
            </div>

            {/* AI Summary */}
            {data?.aiSummary && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h3>
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
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Mark Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Attendance by Subject */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Subject-wise Attendance
              </h2>
              {data?.attendance && Object.keys(data.attendance).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(data.attendance).map(([subject, percentages]) => {
                    const avg = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
                    return (
                      <div key={subject} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{subject}</span>
                          <span className={`text-2xl font-bold ${avg >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                            {avg}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              avg >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${avg}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No attendance records yet</p>
              )}
            </div>

            {/* Attendance History */}
            {attendanceHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Attendance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attendanceHistory.slice(0, 9).map((attendance) => (
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
                        <span className="font-semibold text-gray-900 dark:text-white">
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

        {activeTab === 'academics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Marks */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Subject Marks
              </h2>
              {data?.marks && Object.keys(data.marks).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(data.marks).map(([subject, scores]) => {
                    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                    return (
                      <div key={subject} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{subject}</span>
                          <span className={`text-2xl font-bold ${avg >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {avg}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              avg >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${avg}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No marks records yet</p>
              )}
            </div>

            {/* Mood Check-in */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Mood Check-in
              </h2>
              <form onSubmit={handleCheckin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How are you feeling?</label>
                  <select
                    value={checkinMood}
                    onChange={(e) => setCheckinMood(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">Select mood</option>
                    <option value="happy">😊 Happy</option>
                    <option value="excited">🎉 Excited</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="sad">😢 Sad</option>
                    <option value="anxious">😰 Anxious</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional notes (optional)</label>
                  <textarea
                    value={checkinText}
                    onChange={(e) => setCheckinText(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Share how you're feeling..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Submit Check-in
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-6">
            {/* Medical Request Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                Submit Medical Request
              </h2>
              <form onSubmit={handleMedicalRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
                    <input
                      type="date"
                      value={medicalForm.fromDate}
                      onChange={(e) => setMedicalForm({ ...medicalForm, fromDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
                    <input
                      type="date"
                      value={medicalForm.toDate}
                      onChange={(e) => setMedicalForm({ ...medicalForm, toDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                  <textarea
                    value={medicalForm.reason}
                    onChange={(e) => setMedicalForm({ ...medicalForm, reason: e.target.value })}
                    required
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Describe the reason for your medical request..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Certificate URL (optional)</label>
                  <input
                    type="url"
                    value={medicalForm.certificateUrl}
                    onChange={(e) => setMedicalForm({ ...medicalForm, certificateUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>

            {/* Medical Requests Status */}
            {data?.medicalRequests && data.medicalRequests.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Request Status</h2>
                <div className="space-y-4">
                  {data.medicalRequests.map((request) => (
                    <div
                      key={request._id}
                      className={`p-5 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        request.status === 'approved'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                          : request.status === 'rejected'
                          ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800'
                          : 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                            {new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 mb-2">{request.reason}</p>
                          {request.doctorRemark && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">💬 Doctor: {request.doctorRemark}</p>
                          )}
                        </div>
                        <span
                          className={`px-4 py-2 rounded-xl text-sm font-bold capitalize shadow-lg ${
                            request.status === 'approved'
                              ? 'bg-green-500 text-white'
                              : request.status === 'rejected'
                              ? 'bg-red-500 text-white'
                              : 'bg-yellow-500 text-white'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI Chatbot Floating Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center group"
      >
        {showChatbot ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
          AI
        </span>
      </button>

      {/* AI Chatbot Modal */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col">
          <AIChatbot studentData={data} />
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
