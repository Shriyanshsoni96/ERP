# EduOS Setup Guide

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eduos
JWT_SECRET=your_super_secret_jwt_key_change_this
GEMINI_API_KEY=your_google_gemini_api_key
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is installed and running
mongod
```

**Option B: MongoDB Atlas**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string
- Update `MONGODB_URI` in backend/.env

### 4. Google Gemini API

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `backend/.env` as `GEMINI_API_KEY`

## Testing

1. Open http://localhost:5173
2. Register accounts with different roles:
   - Student (with classId: "class1")
   - Teacher (with classId: "class1")
   - Admin
   - Doctor

3. Login and test each dashboard!

## Troubleshooting

- **MongoDB connection error**: Make sure MongoDB is running
- **CORS errors**: Check backend is running on port 5000
- **API errors**: Check .env files are configured correctly
- **Gemini API errors**: Verify API key is correct (features will have fallback messages)


