const axios = require('axios');

const BASE_URL = 'https://campusai-backend-sfjj.onrender.com/api';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING COMPLETE AUTH + TAB SESSION VERIFICATION');
  console.log('====================================================\n');

  let results = {
    sessionVerification: 'FAIL',
    protectedRoutes: 'FAIL',
    logout: 'FAIL',
    roleProtection: 'FAIL'
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Login as Admin in "Tab 1"
    // ----------------------------------------------------
    console.log('TEST 1: Admin login in Tab 1...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'admin',
      identifier: 'admin'
    });

    if (!adminLoginRes.data.success || !adminLoginRes.data.accessToken) {
      throw new Error('Admin login failed: ' + JSON.stringify(adminLoginRes.data));
    }

    const tab1AccessToken = adminLoginRes.data.accessToken;
    // Extract set-cookie header for HttpOnly refresh cookie
    const cookies = adminLoginRes.headers['set-cookie'];
    const refreshTokenCookie = cookies ? cookies.find(c => c.startsWith('refreshToken=')) : null;

    console.log('✓ Tab 1 logged in successfully. Access token obtained.');
    console.log('  HttpOnly Cookie present:', Boolean(refreshTokenCookie));

    // ----------------------------------------------------
    // TEST 2 & 3: Tab 2 verifies session via /api/auth/me (Intended shared-session)
    // ----------------------------------------------------
    console.log('\nTEST 2 & 3: Tab 2 opens and restores session via /api/auth/me...');
    const tab2MeRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tab1AccessToken}` }
    });

    if (tab2MeRes.data.success && tab2MeRes.data.user?.role === 'admin') {
      console.log('✓ Tab 2 verified session successfully without creating duplicate session: role is', tab2MeRes.data.user.role);
      results.sessionVerification = 'PASS';
    } else {
      throw new Error('Tab 2 session verification failed');
    }

    // Tab 2 accesses Admin-protected endpoint
    const adminStudentsRes = await axios.get(`${BASE_URL}/auth/students`, {
      headers: { Authorization: `Bearer ${tab1AccessToken}` }
    });
    console.log('✓ Tab 2 accessed protected Admin endpoint successfully. Count:', adminStudentsRes.data.count);

    // ----------------------------------------------------
    // TEST 4: Tab 1 logs out
    // ----------------------------------------------------
    console.log('\nTEST 4: Tab 1 logs out...');
    const logoutRes = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${tab1AccessToken}`,
        Cookie: refreshTokenCookie || ''
      }
    });
    console.log('✓ Tab 1 logout response:', logoutRes.data.message);

    // ----------------------------------------------------
    // TEST 5 & 6: In Tab 2, try opening Admin Dashboard / protected endpoint with old token
    // ----------------------------------------------------
    console.log('\nTEST 5 & 6: Tab 2 attempts to use old token after Tab 1 logout...');
    let tab2Blocked = false;
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tab1AccessToken}` }
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✓ Tab 2 blocked with HTTP 401:', err.response.data.message);
        tab2Blocked = true;
      }
    }

    let tab2EndpointBlocked = false;
    try {
      await axios.get(`${BASE_URL}/auth/students`, {
        headers: { Authorization: `Bearer ${tab1AccessToken}` }
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✓ Tab 2 protected endpoint blocked with HTTP 401:', err.response.data.message);
        tab2EndpointBlocked = true;
      }
    }

    // Also verify refresh fails because session is revoked in MongoDB
    let refreshBlocked = false;
    try {
      await axios.post(`${BASE_URL}/auth/refresh`, {}, {
        headers: { Cookie: refreshTokenCookie || '' }
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✓ Refresh attempt blocked with HTTP 401 (session revoked in MongoDB)');
        refreshBlocked = true;
      }
    }

    if (tab2Blocked && tab2EndpointBlocked) {
      results.logout = 'PASS';
      results.protectedRoutes = 'PASS';
    }

    // ----------------------------------------------------
    // TEST 7: Attempting protected route without any token
    // ----------------------------------------------------
    console.log('\nTEST 7: Accessing protected route with no token (unauthenticated)...');
    let unauthenticatedBlocked = false;
    try {
      await axios.get(`${BASE_URL}/auth/me`);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✓ Request rejected with 401 No Token Provided');
        unauthenticatedBlocked = true;
      }
    }

    // ----------------------------------------------------
    // TEST 8 & 9 & 10: Login as Student, try Admin URL
    // ----------------------------------------------------
    console.log('\nTEST 8, 9 & 10: Login as Student and try Admin protected routes...');
    // Create/get a test student
    let studentToken = null;
    try {
      const stReg = await axios.post(`${BASE_URL}/auth/register-student`, {
        name: 'Test Student Auth',
        enrollment: 'STU_AUTH_' + Date.now(),
        email: `student_${Date.now()}@example.com`
      });
      const stLogin = await axios.post(`${BASE_URL}/auth/login`, {
        role: 'student',
        identifier: stReg.data.user.enrollment
      });
      studentToken = stLogin.data.accessToken;
    } catch (e) {
      console.log('Student setup note:', e.message);
    }

    let studentBlockedFromAdmin = false;
    if (studentToken) {
      try {
        // Try admin-only endpoint: POST /api/courses
        await axios.post(`${BASE_URL}/courses`, { name: 'Unauthorized Course', code: 'UC101' }, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
      } catch (err) {
        if (err.response && err.response.status === 403) {
          console.log('✓ Student blocked from Admin route with HTTP 403 Forbidden:', err.response.data.message);
          studentBlockedFromAdmin = true;
        }
      }
    }

    // ----------------------------------------------------
    // TEST 11, 12, 13 & 14: Login as Faculty, try Admin URL
    // ----------------------------------------------------
    console.log('\nTEST 11, 12, 13 & 14: Login as Faculty and try Admin protected routes...');
    let facultyToken = null;
    try {
      const faUsername = 'fac_auth_' + Date.now();
      await axios.post(`${BASE_URL}/auth/register-faculty`, {
        name: 'Test Faculty Auth',
        username: faUsername,
        email: `${faUsername}@example.com`
      });
      const faLogin = await axios.post(`${BASE_URL}/auth/login`, {
        role: 'faculty',
        identifier: faUsername
      });
      facultyToken = faLogin.data.accessToken;
    } catch (e) {
      console.log('Faculty setup note:', e.message);
    }

    let facultyBlockedFromAdmin = false;
    if (facultyToken) {
      try {
        // Try admin-only endpoint: POST /api/courses
        await axios.post(`${BASE_URL}/courses`, { name: 'Unauthorized Course 2', code: 'UC102' }, {
          headers: { Authorization: `Bearer ${facultyToken}` }
        });
      } catch (err) {
        if (err.response && err.response.status === 403) {
          console.log('✓ Faculty blocked from Admin route with HTTP 403 Forbidden:', err.response.data.message);
          facultyBlockedFromAdmin = true;
        }
      }
    }

    if (studentBlockedFromAdmin && facultyBlockedFromAdmin) {
      results.roleProtection = 'PASS';
    }

    console.log('\n====================================================');
    console.log('TEST SUMMARY');
    console.log('====================================================');
    console.log('Session verification:', results.sessionVerification);
    console.log('Protected routes:    ', results.protectedRoutes);
    console.log('Logout:              ', results.logout);
    console.log('Role protection:     ', results.roleProtection);
    console.log('====================================================\n');

  } catch (error) {
    console.error('Test execution error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

runTests();
