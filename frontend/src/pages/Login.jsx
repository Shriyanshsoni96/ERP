import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [faceData, setFaceData] = useState(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const { login, forgotPassword, resetPassword } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const captureFace = () => {
    // Simple face capture using webcam
    // In production, use face-api.js or similar library
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        
        setTimeout(() => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const faceImageData = canvas.toDataURL('image/jpeg');
          setFaceData(faceImageData);
          setShowFaceCapture(false);
          stream.getTracks().forEach(track => track.stop());
        }, 2000);
      })
      .catch(err => {
        setError('Unable to access camera. Please allow camera access.');
        setShowFaceCapture(false);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if email looks like admin (you can customize this logic)
    const emailLower = email.toLowerCase();
    if (emailLower.includes('admin') || emailLower.includes('administrator')) {
      setIsAdminLogin(true);
      if (!faceData) {
        setShowFaceCapture(true);
        return;
      }
    }

    setLoading(true);

    const result = await login(email, password, faceData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
      if (result.message.includes('Face recognition')) {
        setShowFaceCapture(true);
      }
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    
    const result = await forgotPassword(forgotEmail);
    
    if (result.success) {
      setForgotPasswordMessage(result.message);
      // In development, show the reset token
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setResetPasswordMode(true);
      }
    } else {
      setForgotPasswordMessage(result.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    
    if (newPassword.length < 6) {
      setForgotPasswordMessage('Password must be at least 6 characters');
      return;
    }

    const result = await resetPassword(forgotEmail, newPassword, resetToken || null);
    
    if (result.success) {
      setForgotPasswordMessage('Password reset successfully! You can now login.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetPasswordMode(false);
        setForgotEmail('');
        setNewPassword('');
        setResetToken('');
        setForgotPasswordMessage('');
      }, 2000);
    } else {
      setForgotPasswordMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-200">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md transition-colors duration-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">EduOS</h1>
          <p className="text-gray-600 dark:text-gray-400">AI-Powered Educational Operating System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Are you a student?{' '}
          <button
            onClick={() => navigate('/student-login')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Login with Student ID
          </button>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Register (Teachers/Doctors)
          </button>
        </p>
      </div>

      {/* Face Recognition Modal for Admin */}
      {showFaceCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Face Recognition Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Admin login requires face recognition. Please allow camera access.
            </p>
            <div className="flex gap-3">
              <button
                onClick={captureFace}
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Capture Face
              </button>
              <button
                onClick={() => {
                  setShowFaceCapture(false);
                  setIsAdminLogin(false);
                  setFaceData(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {resetPasswordMode ? 'Reset Password' : 'Forgot Password'}
              </h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetPasswordMode(false);
                  setForgotEmail('');
                  setNewPassword('');
                  setResetToken('');
                  setForgotPasswordMessage('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!resetPasswordMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
                
                {forgotPasswordMessage && (
                  <div className={`px-4 py-3 rounded-lg ${
                    forgotPasswordMessage.includes('successfully') || forgotPasswordMessage.includes('sent')
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}>
                    {forgotPasswordMessage}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>

                {resetToken && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-400 mb-2 font-medium">
                      Development Mode: Reset Token
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 break-all">
                      {resetToken}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotEmail('');
                      setForgotPasswordMessage('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enter your new password below.
                </p>

                {forgotPasswordMessage && (
                  <div className={`px-4 py-3 rounded-lg ${
                    forgotPasswordMessage.includes('successfully')
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}>
                    {forgotPasswordMessage}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResetPasswordMode(false);
                      setNewPassword('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
