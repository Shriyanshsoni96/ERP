import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EduOS</h1>
              <p className="text-sm text-gray-600">Student Dashboard</p>
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
        {/* Academic Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Average Attendance</p>
              <p className="text-3xl font-bold text-blue-600">{data?.avgAttendance || 0}%</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Average Marks</p>
              <p className="text-3xl font-bold text-green-600">{data?.avgMarks || 0}%</p>
            </div>
          </div>
          {data?.aiSummary && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700 leading-relaxed">{data.aiSummary}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance</h2>
            {data?.attendance && Object.keys(data.attendance).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.attendance).map(([subject, percentages]) => {
                  const avg = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
                  return (
                    <div key={subject} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{subject}</span>
                      <span className={`font-bold ${avg >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {avg}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No attendance records yet</p>
            )}
          </div>

          {/* Marks */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Marks</h2>
            {data?.marks && Object.keys(data.marks).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.marks).map(([subject, scores]) => {
                  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                  return (
                    <div key={subject} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{subject}</span>
                      <span className={`font-bold ${avg >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {avg}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No marks records yet</p>
            )}
          </div>
        </div>

        {/* Weekly Check-in */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Mood Check-in</h2>
          <form onSubmit={handleCheckin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
              <select
                value={checkinMood}
                onChange={(e) => setCheckinMood(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select mood</option>
                <option value="happy">Happy</option>
                <option value="excited">Excited</option>
                <option value="neutral">Neutral</option>
                <option value="sad">Sad</option>
                <option value="anxious">Anxious</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional notes (optional)</label>
              <textarea
                value={checkinText}
                onChange={(e) => setCheckinText(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Submit Check-in
            </button>
          </form>
        </div>

        {/* Medical Request */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Request</h2>
          <form onSubmit={handleMedicalRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={medicalForm.fromDate}
                  onChange={(e) => setMedicalForm({ ...medicalForm, fromDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={medicalForm.toDate}
                  onChange={(e) => setMedicalForm({ ...medicalForm, toDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <textarea
                value={medicalForm.reason}
                onChange={(e) => setMedicalForm({ ...medicalForm, reason: e.target.value })}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the reason for your medical request..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certificate URL (optional)</label>
              <input
                type="url"
                value={medicalForm.certificateUrl}
                onChange={(e) => setMedicalForm({ ...medicalForm, certificateUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Medical Requests Status */}
        {data?.medicalRequests && data.medicalRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Request Status</h2>
            <div className="space-y-3">
              {data.medicalRequests.map((request) => (
                <div
                  key={request._id}
                  className={`p-4 rounded-lg border ${
                    request.status === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : request.status === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                      {request.doctorRemark && (
                        <p className="text-sm text-gray-700 mt-2 italic">Doctor: {request.doctorRemark}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
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
      </main>
    </div>
  );
};

export default StudentDashboard;

