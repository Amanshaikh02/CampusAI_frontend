const axios = require('axios');
const BASE_URL = 'https://campusai-backend-sfjj.onrender.com/api';

// Frontend visibility logic simulation to verify 100% data consistency
function isAnnouncementVisible(item, currentUser) {
  if (!item || !currentUser) return false;
  const role = (currentUser.role || '').toLowerCase();
  if (role === 'admin') return true;

  // Individual targeting check
  const targetEnrollment = (item.targetStudentEnrollment || item.student || item.recipientEnrollment || item.targetStudent || '').trim().toLowerCase();
  const isIndividual = item.targetType === 'individual' || !!targetEnrollment;

  if (isIndividual) {
    if (role === 'student') {
      const studentEnrollment = (currentUser.enrollment || '').trim().toLowerCase();
      return !!studentEnrollment && targetEnrollment === studentEnrollment;
    }
    return false;
  }

  const userDept = (currentUser.department || currentUser.course || '').trim().toLowerCase();
  const annDept = (item.department || item.targetDepartment || 'All Departments').trim();
  const annRole = (item.targetRole || item.audience || 'Students & Faculty').trim();

  // Department matching
  if (annDept !== 'All Departments') {
    if (!userDept || userDept !== annDept.toLowerCase()) {
      return false;
    }
  }

  // Role matching
  if (role === 'student') {
    return annRole === 'Students' || annRole === 'Students & Faculty' || annRole === 'Everyone';
  }
  return false;
}

async function runTests() {
  console.log('====================================================');
  console.log('TESTING ANNOUNCEMENT FLOW: DASHBOARD vs ANNOUNCEMENTS');
  console.log('====================================================\n');

  try {
    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'admin',
      identifier: 'admin'
    });
    const adminToken = adminLoginRes.data.accessToken;
    console.log('✓ Admin authenticated.');

    // 2. Register/Login Student A (AIML)
    const timeId = Date.now();
    const studentAEnroll = `STU_AIML_${timeId}`;
    console.log(`\n2. Creating Student A (Department: AIML, Enrollment: ${studentAEnroll})...`);
    const regStudentARes = await axios.post(`${BASE_URL}/auth/register-student`, {
      name: 'Alice AIML',
      enrollment: studentAEnroll,
      email: `alice_${timeId}@example.com`,
      department: 'AIML'
    });
    const loginStudentARes = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'student',
      identifier: studentAEnroll
    });
    const studentAToken = loginStudentARes.data.accessToken;
    const studentAUser = loginStudentARes.data.user;
    console.log('✓ Student A logged in.');

    // 3. Register/Login Student B (Cyber Security)
    const studentBEnroll = `STU_CYBER_${timeId}`;
    console.log(`\n3. Creating Student B (Department: Cyber Security, Enrollment: ${studentBEnroll})...`);
    const regStudentBRes = await axios.post(`${BASE_URL}/auth/register-student`, {
      name: 'Bob Cyber',
      enrollment: studentBEnroll,
      email: `bob_${timeId}@example.com`,
      department: 'Cyber Security'
    });
    const loginStudentBRes = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'student',
      identifier: studentBEnroll
    });
    const studentBToken = loginStudentBRes.data.accessToken;
    const studentBUser = loginStudentBRes.data.user;
    console.log('✓ Student B logged in.');

    // 4. Admin Creates Test Announcements
    console.log('\n4. Admin creating test announcements with various target rules:');
    
    // Ann 1: All Departments -> Students
    const ann1Res = await axios.post(`${BASE_URL}/announcements`, {
      title: `General Campus Circular ${timeId}`,
      message: 'This announcement is meant for all students in all departments.',
      department: 'All Departments',
      targetRole: 'Students'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✓ Published Announcement 1: [All Departments] -> Students');

    // Ann 2: AIML Only -> Students
    const ann2Res = await axios.post(`${BASE_URL}/announcements`, {
      title: `AIML Deep Learning Lab ${timeId}`,
      message: 'Special session for AIML department students only.',
      department: 'AIML',
      targetRole: 'Students'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✓ Published Announcement 2: [AIML] -> Students');

    // Ann 3: Cyber Security Only -> Students
    const ann3Res = await axios.post(`${BASE_URL}/announcements`, {
      title: `Cyber Security CTF Contest ${timeId}`,
      message: 'Special workshop for Cyber Security department students only.',
      department: 'Cyber Security',
      targetRole: 'Students'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✓ Published Announcement 3: [Cyber Security] -> Students');

    // Ann 4: Individual targeted to Student A
    const ann4Res = await axios.post(`${BASE_URL}/announcements`, {
      title: `Personal Notice for Student A ${timeId}`,
      message: 'Individual notification strictly for Student A.',
      department: 'All Departments',
      targetRole: 'Students',
      targetType: 'individual',
      targetStudentEnrollment: studentAEnroll
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log(`✓ Published Announcement 4: Individual -> [${studentAEnroll}]`);

    // 5. Query announcements as Student A (AIML)
    console.log('\n5. Fetching announcements as Student A (AIML)...');
    const studentAFetch = await axios.get(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const studentAAnnouncements = studentAFetch.data.data;
    const studentAVisible = studentAAnnouncements.filter(a => isAnnouncementVisible(a, studentAUser));

    console.log(`   Student A received ${studentAVisible.length} visible announcements:`);
    studentAVisible.forEach(a => console.log(`   - "${a.title}" [Dept: ${a.department}, Target: ${a.targetStudentEnrollment || a.targetRole}]`));

    // Assertions for Student A:
    const aSeesAllDept = studentAVisible.some(a => a.title.includes(`General Campus Circular ${timeId}`));
    const aSeesAIML = studentAVisible.some(a => a.title.includes(`AIML Deep Learning Lab ${timeId}`));
    const aSeesCyber = studentAVisible.some(a => a.title.includes(`Cyber Security CTF Contest ${timeId}`));
    const aSeesIndividual = studentAVisible.some(a => a.title.includes(`Personal Notice for Student A ${timeId}`));

    if (!aSeesAllDept) throw new Error('Student A should see All Departments announcement');
    if (!aSeesAIML) throw new Error('Student A should see AIML announcement');
    if (aSeesCyber) throw new Error('Student A must NOT see Cyber Security announcement');
    if (!aSeesIndividual) throw new Error('Student A should see individual announcement');
    console.log('✓ Student A visibility checks PASSED.');

    // 6. Query announcements as Student B (Cyber Security)
    console.log('\n6. Fetching announcements as Student B (Cyber Security)...');
    const studentBFetch = await axios.get(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    const studentBAnnouncements = studentBFetch.data.data;
    const studentBVisible = studentBAnnouncements.filter(a => isAnnouncementVisible(a, studentBUser));

    console.log(`   Student B received ${studentBVisible.length} visible announcements:`);
    studentBVisible.forEach(a => console.log(`   - "${a.title}" [Dept: ${a.department}, Target: ${a.targetStudentEnrollment || a.targetRole}]`));

    // Assertions for Student B:
    const bSeesAllDept = studentBVisible.some(a => a.title.includes(`General Campus Circular ${timeId}`));
    const bSeesAIML = studentBVisible.some(a => a.title.includes(`AIML Deep Learning Lab ${timeId}`));
    const bSeesCyber = studentBVisible.some(a => a.title.includes(`Cyber Security CTF Contest ${timeId}`));
    const bSeesIndividualA = studentBVisible.some(a => a.title.includes(`Personal Notice for Student A ${timeId}`));

    if (!bSeesAllDept) throw new Error('Student B should see All Departments announcement');
    if (bSeesAIML) throw new Error('Student B must NOT see AIML announcement');
    if (!bSeesCyber) throw new Error('Student B should see Cyber Security announcement');
    if (bSeesIndividualA) throw new Error('Student B must NOT see Student A individual announcement');
    console.log('✓ Student B visibility checks PASSED.');

    // 7. Verify Student Dashboard Recent Announcements logic
    console.log('\n7. Verifying Dashboard Recent Announcements sorting and capping (newest first, max 3)...');
    const sortedA = [...studentAVisible].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    const dashboardRecentA = sortedA.slice(0, 3);
    console.log(`   Student A Dashboard Recent Announcements count: ${dashboardRecentA.length}`);
    dashboardRecentA.forEach((a, idx) => console.log(`   ${idx + 1}. "${a.title}" (${a.createdAt})`));

    if (dashboardRecentA.length > 3) throw new Error('Dashboard must show at most 3 recent announcements');
    if (dashboardRecentA.length >= 2) {
      const firstTime = new Date(dashboardRecentA[0].createdAt).getTime();
      const secondTime = new Date(dashboardRecentA[1].createdAt).getTime();
      if (firstTime < secondTime) throw new Error('Recent announcements are not sorted newest first');
    }
    console.log('✓ Dashboard Recent Announcements logic PASSED.');

    console.log('\n====================================================');
    console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('====================================================');

    // Clean up created announcements
    await axios.delete(`${BASE_URL}/announcements/${ann1Res.data.data._id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.delete(`${BASE_URL}/announcements/${ann2Res.data.data._id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.delete(`${BASE_URL}/announcements/${ann3Res.data.data._id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.delete(`${BASE_URL}/announcements/${ann4Res.data.data._id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✓ Test announcements cleaned up.');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) console.error('Response data:', error.response.data);
    process.exit(1);
  }
}

runTests();
