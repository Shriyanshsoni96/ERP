import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../utils/axios';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answering, setAnswering] = useState(false);
  const [users, setUsers] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [activityRoleFilter, setActivityRoleFilter] = useState('all');
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: '',
    classId: '',
    password: ''
  });
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudentId, setNewStudentId] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
      setUserCounts(response.data.counts);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/create-student', newStudent);
      alert('Student created successfully!');
      setShowCreateStudent(false);
      setNewStudent({ name: '', email: '', studentId: '', classId: '', password: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create student');
    }
  };

  const handleAssignStudentId = async (userId) => {
    if (!newStudentId.trim()) {
      alert('Please enter a Student ID');
      return;
    }
    try {
      await api.put(`/admin/assign-student-id/${userId}`, { studentId: newStudentId });
      alert('Student ID assigned successfully!');
      setEditingStudent(null);
      setNewStudentId('');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign Student ID');
    }
  };

  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const params = activityRoleFilter !== 'all' ? { role: activityRoleFilter } : {};
      const response = await api.get('/admin/activities', { params });
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchAttendanceOverview = async () => {
    setAttendanceLoading(true);
    try {
      const response = await api.get('/admin/attendance-overview');
      setAttendanceOverview(response.data);
    } catch (error) {
      console.error('Error fetching attendance overview:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activities') {
      fetchActivities();
    } else if (activeTab === 'attendance') {
      fetchAttendanceOverview();
    }
  }, [activeTab, activityRoleFilter]);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'doctor':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.classId && user.classId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setAnswering(true);
    setAnswer('');

    try {
      const response = await api.post('/admin/ask-question', { question });
      setAnswer(response.data.answer);
    } catch (error) {
      setAnswer('Unable to process your question. Please try again.');
    } finally {
      setAnswering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  EduOS
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center">
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
        <div className="flex space-x-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Users ({userCounts.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'activities'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Activity Monitor
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Attendance Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Manage Students
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👨‍💼</h2>
                <p className="text-orange-100 text-lg">Administrator Dashboard</p>
              </div>
            </div>

            {/* Institution Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                Institution Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {data?.overallAttendance || 0}%
                    </span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Overall Attendance</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Institution average</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {data?.overallPerformance || 0}%
                    </span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Overall Performance</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Academic average</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {data?.totalClasses || 0}
                    </span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Total Classes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Active classes</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {data?.totalStudents || 0}
                    </span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">Total Students</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Enrolled students</p>
                </div>
              </div>
              {data?.aiSummary && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Insights</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{data.aiSummary}</p>
                </div>
              )}
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              Risk Alerts
            </h2>
            {data?.riskAreas && data.riskAreas.length > 0 ? (
              <div className="space-y-3">
                {data.riskAreas.map((risk, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{risk.type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Class: {risk.class}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold shadow-lg">
                        {risk.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No risk areas identified. Institution is performing well! 🎉</p>
            )}
          </div>

          {/* Medical Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              Medical Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{data?.medicalStats?.pending || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-all">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{data?.medicalStats?.approved || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800 hover:shadow-lg transition-all">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{data?.medicalStats?.rejected || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data?.medicalStats?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Decision Assistant */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            AI Decision Assistant
          </h2>
          <form onSubmit={handleAskQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ask a question about your institution
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                rows="3"
                placeholder="e.g., Which classes need the most attention?"
              />
            </div>
            <button
              type="submit"
              disabled={!question.trim() || answering}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {answering ? 'Processing...' : 'Ask AI'}
            </button>
            {answer && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{answer}</p>
              </div>
            )}
          </form>
        </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {userCounts.total || 0}
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">Total Users</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {userCounts.students || 0}
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">Students</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {userCounts.teachers || 0}
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">Teachers</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {userCounts.doctors || 0}
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 font-medium">Doctors</h3>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, email, or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="doctor">Doctors</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  All Users ({filteredUsers.length})
                </h2>
              </div>
              
              {usersLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No users found matching your criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Class ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((userItem) => (
                        <tr key={userItem._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{userItem.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{userItem.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                              {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">
                              {userItem.role === 'student' ? (
                                userItem.studentId ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">{userItem.studentId}</span>
                                ) : (
                                  <span className="text-red-500 dark:text-red-400 italic text-xs">Not Assigned</span>
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userItem.classId || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  Activity Monitor
                </h2>
                <select
                  value={activityRoleFilter}
                  onChange={(e) => setActivityRoleFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="doctor">Doctors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              {activitiesLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activities...</p>
                </div>
              ) : activities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activities found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRoleBadgeColor(activity.role)}`}>
                              {activity.role}
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {activity.userId?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({activity.userId?.email || 'N/A'})
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{activity.action}</p>
                          {activity.details && Object.keys(activity.details).length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {JSON.stringify(activity.details).substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Today's Attendance Overview
              </h2>

              {attendanceLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading attendance...</p>
                </div>
              ) : attendanceOverview ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Students Attendance */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Students</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Present</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {attendanceOverview.today?.students?.present || 0}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Late</p>
                          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                            {attendanceOverview.today?.students?.late || 0}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Absent</p>
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {attendanceOverview.today?.students?.absent || 0}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Total</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {attendanceOverview.today?.students?.total || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Teachers Attendance */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800 shadow-lg">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Teachers</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Present</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {attendanceOverview.today?.teachers?.present || 0}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Late</p>
                          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                            {attendanceOverview.today?.teachers?.late || 0}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Absent</p>
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {attendanceOverview.today?.teachers?.absent || 0}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Total</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {attendanceOverview.today?.teachers?.total || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Records */}
                  {attendanceOverview.attendanceRecords && attendanceOverview.attendanceRecords.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Attendance Records</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check-in</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {attendanceOverview.attendanceRecords.map((record) => (
                              <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {record.userId?.name || 'Unknown'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRoleBadgeColor(record.role)}`}>
                                    {record.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                                      record.status === 'present'
                                        ? 'bg-green-500 text-white'
                                        : record.status === 'late'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-red-500 text-white'
                                    }`}
                                  >
                                    {record.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(record.checkInTime).toLocaleTimeString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No attendance data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  Manage Students
                </h2>
                <button
                  onClick={() => setShowCreateStudent(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  + Create New Student
                </button>
              </div>

              {/* Students List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Class ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.filter(u => u.role === 'student').map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {student.studentId || (
                              <span className="text-red-500 dark:text-red-400 italic">Not Assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.classId || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!student.studentId ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter Student ID"
                                value={editingStudent === student._id ? newStudentId : ''}
                                onChange={(e) => setNewStudentId(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                onFocus={() => setEditingStudent(student._id)}
                              />
                              <button
                                onClick={() => handleAssignStudentId(student._id)}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                              >
                                Assign
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStudent(student._id);
                                setNewStudentId(student.studentId);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
                            >
                              Change ID
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Student Modal */}
      {showCreateStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Student</h2>
              <button
                onClick={() => {
                  setShowCreateStudent(false);
                  setNewStudent({ name: '', email: '', studentId: '', classId: '', password: '' });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student ID *</label>
                <input
                  type="text"
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., STU001, STU2024-001"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This ID will be used for student login</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class ID</label>
                <input
                  type="text"
                  value={newStudent.classId}
                  onChange={(e) => setNewStudent({ ...newStudent, classId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., class1, class2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password (Optional)</label>
                <input
                  type="password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Leave empty for default: student123"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default password: student123 (if left empty)</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateStudent(false);
                    setNewStudent({ name: '', email: '', studentId: '', classId: '', password: '' });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


