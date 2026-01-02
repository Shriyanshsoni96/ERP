import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({ subject: '', percentage: '' });
  const [marksForm, setMarksForm] = useState({ subject: '', score: '' });

  useEffect(() => {
    fetchDashboardData();
    fetchStudents();
  }, []);

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
    } catch (error) {
      alert('Failed to update marks');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EduOS</h1>
              <p className="text-sm text-gray-600">Teacher Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-blue-600">{data?.totalStudents || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
              <p className="text-3xl font-bold text-green-600">{data?.avgAttendance || 0}%</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Marks</p>
              <p className="text-3xl font-bold text-purple-600">{data?.avgMarks || 0}%</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Need Attention</p>
              <p className="text-3xl font-bold text-orange-600">{data?.studentsNeedingAttention?.length || 0}</p>
            </div>
          </div>
          {data?.aiSummary && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700 leading-relaxed">{data.aiSummary}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Students Needing Attention */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Students Needing Attention</h2>
            {data?.studentsNeedingAttention && data.studentsNeedingAttention.length > 0 ? (
              <div className="space-y-3">
                {data.studentsNeedingAttention.map((student) => (
                  <div key={student.id} className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Attendance: {student.avgAttendance}% | Marks: {student.avgMarks}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Medical Approval: {student.hasMedicalApproval ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">All students are doing well! 🎉</p>
            )}
          </div>

          {/* All Students */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Students</h2>
            {students.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student._id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStudent === student._id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedStudent(student._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          student.hasMedicalApproval
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {student.hasMedicalApproval ? 'Medical ✓' : 'No Medical'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No students in your class</p>
            )}
          </div>
        </div>

        {/* Update Attendance */}
        {selectedStudent && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Attendance</h2>
            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={attendanceForm.subject}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attendanceForm.percentage}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, percentage: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Update Attendance
              </button>
            </form>
          </div>
        )}

        {/* Update Marks */}
        {selectedStudent && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Marks</h2>
            <form onSubmit={handleMarksSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={marksForm.subject}
                    onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={marksForm.score}
                    onChange={(e) => setMarksForm({ ...marksForm, score: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Update Marks
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;


