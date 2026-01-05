import { createContext, useState, useEffect } from 'react';
import api from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Optionally verify token is still valid by making a test request
          // For now, we'll just set the user from localStorage
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, faceData = null) => {
    try {
      const response = await api.post('/auth/login', { email, password, faceData });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { 
        success: true, 
        message: response.data.message,
        resetToken: response.data.resetToken // Only for development
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send reset email' 
      };
    }
  };

  const resetPassword = async (email, newPassword, resetToken = null) => {
    try {
      const response = await api.post('/auth/reset-password', { 
        email, 
        newPassword, 
        resetToken 
      });
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  };

  const studentLogin = async (studentId) => {
    try {
      const response = await api.post('/auth/student-login', { studentId });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Student login failed'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, forgotPassword, resetPassword, studentLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

