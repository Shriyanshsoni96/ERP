# EduOS Backend

Express.js + MongoDB backend for EduOS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eduos
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
```

3. Start MongoDB (if using local):
```bash
mongod
```

4. Run the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Student
- `GET /api/student/dashboard` - Get dashboard data
- `POST /api/student/checkin` - Save mood check-in
- `POST /api/student/medical-request` - Submit medical request
- `GET /api/student/medical-requests` - Get medical requests

### Teacher
- `GET /api/teacher/class-overview` - Get class overview
- `GET /api/teacher/students` - Get all students
- `POST /api/teacher/attendance` - Update attendance
- `POST /api/teacher/marks` - Update marks

### Admin
- `GET /api/admin/dashboard` - Get institution summary
- `POST /api/admin/ask-question` - Ask AI question

### Doctor
- `GET /api/doctor/dashboard` - Get overview
- `GET /api/doctor/medical-requests` - Get all requests
- `GET /api/doctor/medical-requests/:id` - Get single request
- `POST /api/doctor/medical-requests/:id/approve` - Approve request
- `POST /api/doctor/medical-requests/:id/reject` - Reject request


