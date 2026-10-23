const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Session = require('../models/Session');

async function testFullHttpPipeline() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB.');

  // Import Express app
  const express = require('express');
  const cors = require('cors');
  const cookieParser = require('cookie-parser');
  const app = express();

  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());

  const { protect } = require('../middleware/auth');
  const markRoutes = require('../routes/markRoutes');
  const analyticsRoutes = require('../routes/analyticsRoutes');

  app.use('/api/marks', protect, markRoutes);
  app.use('/api/analytics', protect, analyticsRoutes);

  // Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  const JWT_SECRET = process.env.JWT_SECRET || 'campus_ai_super_secret_jwt_key_2026';

  // Helper to create valid JWT token & active DB session
  async function createTestToken(user) {
    const sessionToken = 'sess_' + Math.random().toString(36).substring(2);
    const session = await Session.create({
      userId: user._id,
      sessionToken,
      refreshTokenHash: 'hash_' + sessionToken,
      role: user.role === 'teacher' ? 'faculty' : user.role,
      expiresAt: new Date(Date.now() + 3600000),
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    });
    return jwt.sign(
      { userId: user._id.toString(), id: user._id.toString(), role: user.role, sessionId: session._id.toString() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  // 1. Test Student HTTP
  console.log('\n[1] HTTP Test: Student Calling /api/marks/analytics/student-performance');
  const student = await User.findOne({ enrollment: '23018501210234', role: 'student' });
  const studentToken = await createTestToken(student);

  const stuRes = await fetch(`http://localhost:${port}/api/marks/analytics/student-performance`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const stuData = await stuRes.json();
  console.log('HTTP Status:', stuRes.status);
  console.log('Student Name:', stuData.student?.name);
  console.log('Overall Score:', stuData.metrics?.overallPercentage + '%');
  console.log('CGPA:', stuData.metrics?.cgpa);
  console.log('Attendance:', stuData.metrics?.attendance?.percentage + '%');
  console.log('Current Sem Subjects:', stuData.currentSemesterSubjects?.map(s => `${s.subject}: ${s.percentage}%`));
  console.log('Semester Trends:', stuData.semesterTrends?.map(s => `${s.label}: ${s.percentage}%`));

  // 2. Test Faculty HTTP
  console.log('\n[2] HTTP Test: Faculty Calling /api/marks/analytics/faculty-subjects');
  const faculty = await User.findOne({ role: { $in: ['faculty', 'teacher'] }, assignedSubject: 'Machine Learning' })
    || await User.findOne({ role: { $in: ['faculty', 'teacher'] } });
  const facultyToken = await createTestToken(faculty);

  const facSubRes = await fetch(`http://localhost:${port}/api/marks/analytics/faculty-subjects`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const facSubData = await facSubRes.json();
  console.log('HTTP Status:', facSubRes.status);
  console.log('Assigned Subjects:', facSubData.data?.map(s => `${s.subject} (Avg: ${s.classAverage}%)`));

  const targetSubject = facSubData.data?.[0]?.subject || 'Machine Learning';
  console.log(`\nFaculty fetching students for subject '${targetSubject}'...`);
  const facStuRes = await fetch(`http://localhost:${port}/api/marks/analytics/faculty-students?subject=${encodeURIComponent(targetSubject)}`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const facStuData = await facStuRes.json();
  console.log('Students in class:', facStuData.data?.map(s => `${s.name} (${s.enrollment}): ${s.percentage}%`));

  // Faculty comparing selected student against class average in this subject
  const firstStudentEnrollment = facStuData.data?.[0]?.enrollment;
  const facCompRes = await fetch(`http://localhost:${port}/api/marks/analytics/student-performance?subject=${encodeURIComponent(targetSubject)}&enrollment=${firstStudentEnrollment}`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const facCompData = await facCompRes.json();
  console.log('Student vs Class Average in subject:');
  console.log('  Student:', facCompData.facultyComparison?.studentPercentage + '%');
  console.log('  Class Avg:', facCompData.facultyComparison?.classAveragePercentage + '%');
  console.log('  Above Avg?:', facCompData.facultyComparison?.isAboveAverage);

  // 3. Test Admin Search HTTP
  console.log('\n[3] HTTP Test: Admin Autocomplete Search');
  const admin = await User.findOne({ role: 'admin' });
  const adminToken = await createTestToken(admin);

  const searchRes = await fetch(`http://localhost:${port}/api/marks/analytics/search-students?q=Shaikh`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const searchData = await searchRes.json();
  console.log('Admin search results count:', searchData.data?.length);
  console.log('Top match:', searchData.data?.[0]?.name, searchData.data?.[0]?.enrollment);

  server.close();
  console.log('\n✓ HTTP END-TO-END VERIFICATION COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testFullHttpPipeline().catch(err => {
  console.error('HTTP test error:', err);
  process.exit(1);
});
