# EduOS - AI-Powered Educational Operating System

A modern, clean educational operating system powered by Google Gemini AI. Built with MERN stack for hackathons.

## 🚀 Features

- **Role-Based Access**: Student, Teacher, Admin, and Doctor dashboards
- **AI-Powered Insights**: Google Gemini integration for summaries and suggestions
- **Medical Request System**: Students can submit medical requests, doctors can approve/reject
- **Attendance & Marks Management**: Teachers can update student data
- **Modern UI**: Clean, premium design with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- React 19 (Vite)
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

### AI
- Google Gemini API

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Gemini API Key

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Backend Configuration

1. Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eduos
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GEMINI_API_KEY=your_google_gemini_api_key_here
```

2. Get your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. Make sure MongoDB is running (or use MongoDB Atlas)

### 3. Frontend Configuration

1. Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 👥 User Roles

### Student
- View academic summary (AI-generated)
- Check attendance and marks
- Weekly mood check-in
- Submit medical requests
- View medical request status

### Teacher
- View class overview
- See students needing attention
- Update attendance and marks
- Check medical approval status

### Admin
- Institution-wide summary (AI-generated)
- Risk alerts
- Medical statistics
- AI decision assistant

### Doctor
- View all medical requests
- Approve/reject medical certificates
- Add doctor remarks
- View AI-summarized requests

## 📁 Project Structure

```
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── services/        # Gemini AI service
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Auth context
│   │   └── utils/       # Utilities (axios)
│   └── package.json
└── README.md
```

## 🔐 Authentication

JWT-based authentication. Tokens are stored in localStorage.

## 🤖 AI Integration

Google Gemini is used for:
- Academic summaries
- Class performance analysis
- Institution insights
- Medical request summarization (for clarity only, NOT diagnosis)

## 📝 Notes

- This is a hackathon project - keep it simple and demo-ready
- Medical system is for administration only, NOT for diagnosis
- All AI features are optional and can work without Gemini API (with fallback messages)

## 🎯 Demo Accounts

Create accounts through the registration page with different roles:
- Student (with classId)
- Teacher (with classId)
- Admin
- Doctor

## 📄 License

ISC

## 🙏 Acknowledgments

Built for hackathons with modern MERN stack and AI integration.


