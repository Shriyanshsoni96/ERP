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




