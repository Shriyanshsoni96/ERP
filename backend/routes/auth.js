import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register - Only for teachers, doctors, and admins (not students)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, classId } = req.body;

    // Validate
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Students cannot register through this route
    if (role === 'student') {
      return res.status(400).json({ message: 'Students must use their allocated ID to login. Registration is not allowed for students.' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email has been used before (strict check)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'This email has already been registered. Please use a different email or contact administrator.' });
    }

    // Create user
    const user = new User({ name, email: normalizedEmail, password, role, classId: classId || null });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classId: user.classId
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login - For teachers, doctors, and admins (NOT students)
router.post('/login', async (req, res) => {
  try {
    const { email, password, faceData } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.error(`Login attempt failed: User not found with email: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Students cannot login through this route
    if (user.role === 'student') {
      return res.status(403).json({ message: 'Students must login using their allocated Student ID. Please use the student login page.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.error(`Login attempt failed: Password mismatch for user: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Face recognition required for admin
    if (user.role === 'admin') {
      if (!faceData) {
        return res.status(400).json({ message: 'Face recognition is required for admin login' });
      }
      
      // Basic face verification (in production, use proper face recognition API)
      // For now, we'll just check if faceData is provided
      // TODO: Implement proper face recognition comparison
      if (!user.faceData) {
        // First time admin login - save face data
        user.faceData = faceData;
        await user.save();
      } else {
        // Compare face data (simplified - in production use face-api.js or similar)
        // For now, we'll just verify that faceData is provided
        // In production: const isFaceMatch = await compareFaces(user.faceData, faceData);
        // if (!isFaceMatch) return res.status(401).json({ message: 'Face recognition failed' });
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classId: user.classId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student login by ID
router.post('/student-login', async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Find student by studentId
    const user = await User.findOne({ studentId: studentId.trim(), role: 'student' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Student ID' });
    }

    // Generate token (no password required for student login by ID)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classId: user.classId,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot password - request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, type: 'password-reset' },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '1h' }
    );

    // In production, send email with reset link
    // For now, we'll return the token (in production, don't expose this)
    console.log(`Password reset requested for: ${normalizedEmail}`);
    console.log(`Reset token: ${resetToken}`); // Remove in production

    res.json({
      message: 'Password reset instructions have been sent to your email.',
      resetToken // Remove this in production - only for development
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If resetToken is provided, verify it
    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'default_secret_key');
        if (decoded.id !== user._id.toString() || decoded.type !== 'password-reset') {
          return res.status(401).json({ message: 'Invalid reset token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired reset token' });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint - check if user exists (remove in production)
router.get('/debug/user/:email', async (req, res) => {
  try {
    const normalizedEmail = req.params.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({ exists: false, message: 'User not found' });
    }
    res.json({
      exists: true,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

