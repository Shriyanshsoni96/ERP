import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate academic summary for student
 */
export async function getStudentSummary(studentData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an AI assistant for a student ERP system. Analyze this student data and provide a brief, friendly summary (2-3 sentences max):
    
    Name: ${studentData.name}
    Overall Attendance: ${studentData.attendance}%
    Subjects: ${JSON.stringify(studentData.subjects)}
    Marks: ${JSON.stringify(studentData.marks)}
    
    Provide a summary that:
    1. States how the student is doing overall
    2. Highlights one key area that needs attention (if any)
    3. Be encouraging and constructive
    
    Keep it concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Unable to generate summary at the moment. Please try again later.";
  }
}

/**
 * Generate class summary for teacher
 */
export async function getClassSummary(classData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an AI assistant for a teacher dashboard. Analyze this class data and provide a brief summary (2-3 sentences):
    
    Average Attendance: ${classData.avgAttendance}%
    Average Marks: ${classData.avgMarks}
    Total Students: ${classData.totalStudents}
    Students Needing Attention: ${classData.studentsNeedingAttention}
    
    Provide insights about:
    1. Overall class performance
    2. Key areas of concern
    3. What the teacher should focus on
    
    Be concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Class data analysis is currently unavailable. Please check back later.";
  }
}

/**
 * Generate institution summary for admin
 */
export async function getInstitutionSummary(institutionData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an AI assistant for an admin dashboard. Analyze this institution data and provide a brief summary (2-3 sentences):
    
    Overall Attendance: ${institutionData.overallAttendance}%
    Overall Performance: ${institutionData.overallPerformance}
    Total Classes: ${institutionData.totalClasses}
    Total Students: ${institutionData.totalStudents}
    Risk Areas: ${JSON.stringify(institutionData.riskAreas)}
    
    Provide insights about:
    1. Overall institution health
    2. Key risk areas
    3. Priority actions
    
    Be concise and strategic.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Institution analysis is currently unavailable. Please check back later.";
  }
}

/**
 * Answer admin question
 */
export async function answerAdminQuestion(question, institutionData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an AI assistant for an educational institution admin. Answer this question based on the available data:
    
    Question: ${question}
    
    Available Data:
    - Overall Attendance: ${institutionData.overallAttendance}%
    - Overall Performance: ${institutionData.overallPerformance}
    - Risk Areas: ${JSON.stringify(institutionData.riskAreas)}
    
    Provide a clear, concise answer (2-4 sentences). If the question cannot be answered with the available data, say so politely.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "I'm unable to process your question at the moment. Please try again later.";
  }
}

/**
 * Summarize medical request text (for clarity only, not diagnosis)
 */
export async function summarizeMedicalRequest(reason) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Summarize this medical request reason in 1-2 sentences for clarity (this is NOT a diagnosis, just a summary):
    
    ${reason}
    
    Provide a clear, concise summary.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return reason; // Return original if summarization fails
  }
}

/**
 * Answer student questions and provide guidance
 */
export async function answerStudentQuestion(question, studentData = null) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    let contextPrompt = '';
    if (studentData) {
      contextPrompt = `
      Student Context:
      - Name: ${studentData.name || 'Student'}
      - Average Attendance: ${studentData.attendance || 0}%
      - Average Marks: ${studentData.marks || 0}%
      - Subjects: ${studentData.subjects ? JSON.stringify(studentData.subjects) : 'N/A'}
      `;
    }
    
    const prompt = `You are a friendly and helpful AI tutor assistant for students. Your role is to:
    1. Answer academic questions clearly and concisely
    2. Provide study guidance and tips
    3. Help solve doubts and problems
    4. Be encouraging and supportive
    5. Explain concepts in simple, easy-to-understand language
    
    ${contextPrompt}
    
    Student Question: ${question}
    
    Provide a helpful, clear answer. If the question is about academics, provide detailed explanations. If it's about study tips or guidance, be practical and actionable. Keep responses conversational and friendly, but informative.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "I'm having trouble processing your question right now. Please try again in a moment, or rephrase your question.";
  }
}

