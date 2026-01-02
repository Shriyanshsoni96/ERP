import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answering, setAnswering] = useState(false);

  useEffect(() => {
    fetchDashboardData();
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
              <p className="text-sm text-gray-600">Admin Dashboard</p>
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
        {/* Institution Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Overall Attendance</p>
              <p className="text-3xl font-bold text-blue-600">{data?.overallAttendance || 0}%</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Overall Performance</p>
              <p className="text-3xl font-bold text-green-600">{data?.overallPerformance || 0}%</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-purple-600">{data?.totalClasses || 0}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-orange-600">{data?.totalStudents || 0}</p>
            </div>
          </div>
          {data?.aiSummary && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700 leading-relaxed">{data.aiSummary}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Risk Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Alerts</h2>
            {data?.riskAreas && data.riskAreas.length > 0 ? (
              <div className="space-y-3">
                {data.riskAreas.map((risk, idx) => (
                  <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{risk.type}</p>
                        <p className="text-sm text-gray-600 mt-1">Class: {risk.class}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {risk.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No risk areas identified. Institution is performing well! 🎉</p>
            )}
          </div>

          {/* Medical Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{data?.medicalStats?.pending || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-600">{data?.medicalStats?.approved || 0}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{data?.medicalStats?.rejected || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-600">{data?.medicalStats?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Decision Assistant */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Decision Assistant</h2>
          <form onSubmit={handleAskQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ask a question about your institution
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="e.g., Which classes need the most attention?"
              />
            </div>
            <button
              type="submit"
              disabled={!question.trim() || answering}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {answering ? 'Processing...' : 'Ask AI'}
            </button>
            {answer && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-gray-700 leading-relaxed">{answer}</p>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;


