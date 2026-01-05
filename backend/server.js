import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import teacherRoutes from './routes/teacher.js';
import adminRoutes from './routes/admin.js';
import doctorRoutes from './routes/doctor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_model';
console.log(`🔗 Connecting to MongoDB: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials if any

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('💡 Make sure MongoDB is running and the connection string is correct');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EduOS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

