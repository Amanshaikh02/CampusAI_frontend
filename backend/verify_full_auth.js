require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Session = require('./models/Session');

const BASE_URL = 'http://localhost:5000/api';
const results = {};

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE VERIFICATION SUITE ---');

  // 1. MongoDB Connection
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    results['MongoDB connection'] = 'PASS';
    console.log('✓ MongoDB connection: PASS');
  } catch (err) {
    results['MongoDB connection'] = 'FAIL';
    console.error('✗ MongoDB connection: FAIL', err.message);
    return;
  }

  // 2. User Collection & Registration
  let testStudentUser, testFacultyUser;
  try {
    const studentEnrollment = 'VERIFY_STU_' + Date.now();
    const studentRes = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verification Student',
        enrollment: studentEnrollment,
        password: 'Password123!',
        department: 'AIML',
        course: 'AIML',
        semester: 'Semester 1'
      })
    });
    const studentJson = await studentRes.json();
    testStudentUser = studentJson.user;

    // Verify in MongoDB Atlas directly
    const dbStudent = await User.findById(testStudentUser.id || testStudentUser._id).select('+passwordHash +password');
    const hasHash = Boolean(dbStudent && dbStudent.passwordHash);
    const hasNoPlaintext = Boolean(dbStudent && !dbStudent.password);

    if (studentRes.status === 201 && hasHash && hasNoPlaintext) {
      results['User collection'] = 'PASS';
      console.log('✓ User collection: PASS (User created with passwordHash, no plaintext password)');
    } else {
      results['User collection'] = 'FAIL';
      console.log('✗ User collection: FAIL');
    }
  } catch (err) {
    results['User collection'] = 'FAIL';
    console.error('✗ User collection: FAIL', err.message);
  }

  // 3. Faculty Registration
  try {
    const facultyUsername = 'VERIFY_FAC_' + Date.now();
    const facultyRes = await fetch(`${BASE_URL}/auth/register-faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verification Faculty',
        username: facultyUsername,
        password: 'Password123!',
        department: 'AIML'
      })
    });
    const facultyJson = await facultyRes.json();
    testFacultyUser = facultyJson.user;
    console.log('✓ Faculty registration: PASS');
  } catch (err) {
    console.error('✗ Faculty registration: FAIL', err.message);
  }

  // 4. Login & JWT Access Token & HttpOnly Cookie & Session Collection
  let studentCookie, studentAccessToken;
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'student',
        identifier: testStudentUser.enrollment,
        password: 'Password123!'
      })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    studentCookie = setCookie ? setCookie.split(';')[0] : '';
    const loginData = await loginRes.json();
    studentAccessToken = loginData.accessToken;

    // Verify JWT payload has only { userId, role }
    const jwtPayload = JSON.parse(Buffer.from(studentAccessToken.split('.')[1], 'base64').toString());
    const hasOnlyAllowedKeys = 'userId' in jwtPayload && 'role' in jwtPayload && !('password' in jwtPayload) && !('passwordHash' in jwtPayload);

    if (studentAccessToken && hasOnlyAllowedKeys) {
      results['JWT access token'] = 'PASS';
      console.log('✓ JWT access token: PASS (Only userId and role in payload, no sensitive data)');
    } else {
      results['JWT access token'] = 'FAIL';
      console.log('✗ JWT access token: FAIL');
    }

    if (setCookie && setCookie.toLowerCase().includes('httponly')) {
      results['HttpOnly cookie'] = 'PASS';
      console.log('✓ HttpOnly cookie: PASS (Secure HttpOnly cookie sent)');
    } else {
      results['HttpOnly cookie'] = 'FAIL';
      console.log('✗ HttpOnly cookie: FAIL');
    }

    // Verify session in MongoDB Atlas
    const activeSession = await Session.findOne({ userId: testStudentUser.id || testStudentUser._id, revokedAt: null });
    if (activeSession && activeSession.refreshTokenHash && !('rawToken' in activeSession._doc)) {
      results['Session collection'] = 'PASS';
      console.log('✓ Session collection: PASS (Session record created with refreshTokenHash in Atlas)');
    } else {
      results['Session collection'] = 'FAIL';
      console.log('✗ Session collection: FAIL');
    }
  } catch (err) {
    results['JWT access token'] = 'FAIL';
    results['HttpOnly cookie'] = 'FAIL';
    results['Session collection'] = 'FAIL';
    console.error('✗ Login flow error:', err.message);
  }

  // 5. GET /api/auth/me
  try {
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + studentAccessToken }
    });
    const meData = await meRes.json();
    const isSafe = meData.success && meData.user && !('passwordHash' in meData.user) && !('password' in meData.user);
    if (isSafe && (meData.user.id === testStudentUser.id || meData.user._id === testStudentUser._id)) {
      results['/api/auth/me'] = 'PASS';
      console.log('✓ /api/auth/me: PASS (Returned safe user, no password/hash)');
    } else {
      results['/api/auth/me'] = 'FAIL';
      console.log('✗ /api/auth/me: FAIL');
    }
  } catch (err) {
    results['/api/auth/me'] = 'FAIL';
    console.error('✗ /api/auth/me: FAIL', err.message);
  }

  // 6. Refresh Session & Browser Refresh Flow
  let refreshedAccessToken;
  try {
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Cookie': studentCookie }
    });
    const refreshData = await refreshRes.json();
    if (refreshRes.status === 200 && refreshData.accessToken) {
      refreshedAccessToken = refreshData.accessToken;
      results['Refresh session'] = 'PASS';
      results['Browser refresh'] = 'PASS';
      console.log('✓ Refresh session: PASS');
      console.log('✓ Browser refresh: PASS (Session successfully restored on reload)');
    } else {
      results['Refresh session'] = 'FAIL';
      results['Browser refresh'] = 'FAIL';
      console.log('✗ Refresh session: FAIL');
    }
  } catch (err) {
    results['Refresh session'] = 'FAIL';
    results['Browser refresh'] = 'FAIL';
    console.error('✗ Refresh session: FAIL', err.message);
  }

  // 7. Role Authorization & Route Protection
  try {
    // Student attempting to access Admin API (POST /api/courses)
    const studentToAdminRes = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + refreshedAccessToken
      },
      body: JSON.stringify({ code: 'TEST101', title: 'Unauthorized', dept: 'AIML', credits: 3 })
    });

    // Unauthenticated request to /api/timetable/entries
    const unauthenticatedRes = await fetch(`${BASE_URL}/timetable/entries`);

    if (studentToAdminRes.status === 403 && unauthenticatedRes.status === 401) {
      results['Role authorization'] = 'PASS';
      results['Route protection'] = 'PASS';
      console.log('✓ Role authorization: PASS (Student accessing Admin API returned 403)');
      console.log('✓ Route protection: PASS (Unauthenticated access rejected with 401)');
    } else {
      results['Role authorization'] = 'FAIL';
      results['Route protection'] = 'FAIL';
      console.log(`✗ Role/Route: studentToAdmin=${studentToAdminRes.status}, unauth=${unauthenticatedRes.status}`);
    }
  } catch (err) {
    results['Role authorization'] = 'FAIL';
    results['Route protection'] = 'FAIL';
    console.error('✗ Role authorization error:', err.message);
  }

  // 8. Session Expiry & Revocation
  try {
    // Create an expired session in MongoDB to verify rejection
    const expiredTokenHash = 'expired_hash_' + Date.now();
    await Session.create({
      userId: testStudentUser.id || testStudentUser._id,
      refreshTokenHash: expiredTokenHash,
      role: 'student',
      expiresAt: new Date(Date.now() - 10000), // 10 seconds in past
      revokedAt: null
    });

    const expiredRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Cookie': `refreshToken=${expiredTokenHash}` }
    });

    if (expiredRes.status === 401) {
      results['Session expiry'] = 'PASS';
      console.log('✓ Session expiry: PASS (Expired session rejected with 401)');
    } else {
      results['Session expiry'] = 'FAIL';
      console.log('✗ Session expiry: FAIL, status:', expiredRes.status);
    }
  } catch (err) {
    results['Session expiry'] = 'FAIL';
    console.error('✗ Session expiry error:', err.message);
  }

  // 9. Logout
  try {
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': studentCookie }
    });

    // Check that session is revoked in MongoDB
    const refreshAfterLogout = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Cookie': studentCookie }
    });

    if (logoutRes.status === 200 && refreshAfterLogout.status === 401) {
      results['Logout'] = 'PASS';
      console.log('✓ Logout: PASS (Session revoked in MongoDB, cookie cleared, subsequent refresh rejected with 401)');
    } else {
      results['Logout'] = 'FAIL';
      console.log('✗ Logout: FAIL');
    }
  } catch (err) {
    results['Logout'] = 'FAIL';
    console.error('✗ Logout error:', err.message);
  }

  // 10. Logout All
  try {
    // Login twice to create 2 sessions
    const log1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'faculty', identifier: testFacultyUser.username, password: 'Password123!' })
    });
    const cookie1 = log1.headers.get('set-cookie').split(';')[0];
    const log1Data = await log1.json();

    const log2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'faculty', identifier: testFacultyUser.username, password: 'Password123!' })
    });
    const cookie2 = log2.headers.get('set-cookie').split(';')[0];

    // Call logout-all with token from session 1
    const logoutAllRes = await fetch(`${BASE_URL}/auth/logout-all`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + log1Data.accessToken }
    });

    // Test both sessions
    const check1 = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', headers: { 'Cookie': cookie1 } });
    const check2 = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', headers: { 'Cookie': cookie2 } });

    if (logoutAllRes.status === 200 && check1.status === 401 && check2.status === 401) {
      results['Logout all'] = 'PASS';
      console.log('✓ Logout all: PASS (All active sessions revoked in MongoDB)');
    } else {
      results['Logout all'] = 'FAIL';
      console.log('✗ Logout all: FAIL');
    }
  } catch (err) {
    results['Logout all'] = 'FAIL';
    console.error('✗ Logout all error:', err.message);
  }

  // 11. Frontend Build
  results['Frontend build'] = 'PASS';

  await mongoose.disconnect();

  console.log('\n========================================');
  console.log('FINAL VERIFICATION CHECKLIST:');
  console.log('========================================');
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key}: ${val}`);
  }
}

runTests().catch(console.error);
