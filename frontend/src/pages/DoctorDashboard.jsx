import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [overview, setOverview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    fetchOverview();
    fetchRequests();
  }, [statusFilter]);

  const fetchOverview = async () => {
    try {
      const response = await api.get('/doctor/dashboard');
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/doctor/medical-requests', { params });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/doctor/medical-requests/${id}/approve`, { doctorRemark: remark });
      setRemark('');
      setSelectedRequest(null);
      alert('Medical request approved!');
      fetchOverview();
      fetchRequests();
    } catch (error) {
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/doctor/medical-requests/${id}/reject`, { doctorRemark: remark });
      setRemark('');
      setSelectedRequest(null);
      alert('Medical request rejected!');
      fetchOverview();
      fetchRequests();
    } catch (error) {
      alert('Failed to reject request');
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
              <p className="text-sm text-gray-600">Doctor Dashboard</p>
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
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-yellow-50 rounded-xl shadow-sm p-6 border border-yellow-100">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{overview?.pending || 0}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-6 border border-green-100">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-600">{overview?.approved || 0}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-6 border border-red-100">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{overview?.rejected || 0}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm p-6 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-blue-600">{overview?.total || 0}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Medical Requests List */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Requests</h2>
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
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
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {request.studentId?.name || 'Unknown Student'}
                        </h3>
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
                      <p className="text-sm text-gray-600 mb-1">
                        {request.studentId?.email} | Class: {request.studentId?.classId || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Period:</strong> {new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                      {request.aiSummary && (
                        <p className="text-xs text-gray-600 italic mb-2">
                          <strong>AI Summary:</strong> {request.aiSummary}
                        </p>
                      )}
                      {request.certificateUrl && (
                        <a
                          href={request.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          View Certificate
                        </a>
                      )}
                      {request.doctorRemark && (
                        <p className="text-xs text-gray-700 mt-2 italic">
                          <strong>Doctor Remark:</strong> {request.doctorRemark}
                        </p>
                      )}
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setSelectedRequest(request._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedRequest(request._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No medical requests found</p>
          )}
        </div>

        {/* Approval/Rejection Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Doctor Remark</h3>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Enter your remark (optional)"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedRequest)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRemark('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;


