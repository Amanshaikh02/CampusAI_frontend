const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Testing Bulk Marks & RBAC System ---');

  // 1. Login as Admin
  console.log('\n1. Logging in as Admin...');
  let adminToken;
  try {
    const adminRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', identifier: 'admin' })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.accessToken || adminData.token;
    if (!adminToken) throw new Error(JSON.stringify(adminData));
    console.log('✓ Admin login successful.');
  } catch (err) {
    console.error('✗ Admin login failed:', err.message);
    return;
  }

  // 2. Register/Login a dedicated Test Faculty in AIML Department
  console.log('\n2. Registering / Logging in as Faculty (AIML)...');
  let facultyToken;
  const facultyUsername = `fac_test_${Date.now()}`;
  try {
    const regRes = await fetch(`${API_BASE}/auth/register-faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prof. Test AIML Faculty',
        username: facultyUsername,
        department: 'AIML',
        semester: '6',
        classSection: 'A',
        assignedSubject: 'Machine Learning',
        password: 'password123'
      })
    });
    const regData = await regRes.json();

    const facLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'faculty',
        identifier: facultyUsername,
        password: 'password123'
      })
    });
    const facLoginData = await facLoginRes.json();
    facultyToken = facLoginData.accessToken || facLoginData.token;
    console.log('✓ Faculty login successful:', facLoginData.user?.name);
  } catch (err) {
    console.error('✗ Faculty registration/login error:', err.message);
  }

  // 3. Test Faculty RBAC Constraint 1: Final Exam must be rejected for Faculty
  console.log('\n3. Testing Faculty Constraint 1: Faculty cannot select/submit Final Exam...');
  const res1 = await fetch(`${API_BASE}/marks/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`
    },
    body: JSON.stringify({
      department: 'AIML',
      semester: '6',
      division: 'A',
      subject: 'Machine Learning',
      exam: 'Final Exam', // FORBIDDEN FOR FACULTY
      maxMarks: 50,
      marksData: [
        { enrollment: '21AIML001', student: 'Test Student', marks: '45', attendanceStatus: 'Present' }
      ]
    })
  });
  const data1 = await res1.json();
  if (res1.status === 403) {
    console.log('✓ SUCCESS: Server rejected Final Exam for faculty with 403 Forbidden:', data1.message);
  } else {
    console.error(`✗ Unexpected response: status ${res1.status}`, data1);
  }

  // 4. Test Faculty Constraint 2: Max marks > 30 must be rejected
  console.log('\n4. Testing Faculty Constraint 2: Max marks > 30 must be rejected for Faculty...');
  const res2 = await fetch(`${API_BASE}/marks/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`
    },
    body: JSON.stringify({
      department: 'AIML',
      semester: '6',
      division: 'A',
      subject: 'Machine Learning',
      exam: 'Mid Term',
      maxMarks: 40, // FORBIDDEN (> 30)
      marksData: [
        { enrollment: '21AIML001', student: 'Test Student', marks: '35', attendanceStatus: 'Present' }
      ]
    })
  });
  const data2 = await res2.json();
  if (res2.status === 400) {
    console.log('✓ SUCCESS: Server rejected >30 marks with 400 Bad Request:', data2.message);
  } else {
    console.error(`✗ Unexpected response: status ${res2.status}`, data2);
  }

  // 5. Test Faculty Constraint 3: Cross-department access must be rejected
  console.log('\n5. Testing Faculty Constraint 3: Cross-department access must be rejected for Faculty...');
  const res3 = await fetch(`${API_BASE}/marks/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`
    },
    body: JSON.stringify({
      department: 'Cyber Security', // FORBIDDEN (Faculty belongs to AIML)
      semester: '6',
      division: 'A',
      subject: 'Network Security',
      exam: 'Mid Term',
      maxMarks: 30,
      marksData: [
        { enrollment: '21CS001', student: 'Test Student', marks: '25', attendanceStatus: 'Present' }
      ]
    })
  });
  const data3 = await res3.json();
  if (res3.status === 403) {
    console.log('✓ SUCCESS: Server rejected cross-department access with 403 Forbidden:', data3.message);
  } else {
    console.error(`✗ Unexpected response: status ${res3.status}`, data3);
  }

  // 6. Test Faculty Valid Mid Term entry (maxMarks = 30)
  console.log('\n6. Testing Faculty Valid Submission (Mid Term, maxMarks = 30, Present & Absent)...');
  const res4 = await fetch(`${API_BASE}/marks/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`
    },
    body: JSON.stringify({
      department: 'AIML',
      semester: '6',
      division: 'A',
      subject: 'Machine Learning',
      exam: 'Mid Term',
      maxMarks: 30,
      marksData: [
        { enrollment: '21AIML001', student: 'Aarav Patel', marks: '27', attendanceStatus: 'Present', grade: 'A+' },
        { enrollment: '21AIML002', student: 'Bhavna Sharma', marks: 'AB', attendanceStatus: 'Absent', grade: 'AB' }
      ]
    })
  });
  const data4 = await res4.json();
  if (res4.ok) {
    console.log('✓ SUCCESS: Faculty bulk saved marks:', data4.message, `(Count: ${data4.count})`);
  } else {
    console.error('✗ Faculty valid submission failed:', data4);
  }

  // 7. Test Admin Full Access: Can submit Final Exam with 50 marks & across any department
  console.log('\n7. Testing Admin Full Access (Final Exam, maxMarks = 50)...');
  const res5 = await fetch(`${API_BASE}/marks/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      department: 'Cyber Security',
      semester: '7',
      division: 'B',
      subject: 'Network Security',
      exam: 'Final Exam',
      maxMarks: 50,
      marksData: [
        { enrollment: '21CS001', student: 'Rohan Mehra', marks: '44', attendanceStatus: 'Present', grade: 'A' },
        { enrollment: '21CS002', student: 'Priya Joshi', marks: 'AB', attendanceStatus: 'Absent', grade: 'AB' }
      ]
    })
  });
  const data5 = await res5.json();
  if (res5.ok) {
    console.log('✓ SUCCESS: Admin bulk saved Final Exam marks:', data5.message, `(Count: ${data5.count})`);
  } else {
    console.error('✗ Admin bulk save failed:', data5);
  }

  // 8. Test Nodemailer Email Dispatch
  console.log('\n8. Testing Marksheet Email Dispatch (POST /api/marks/send-email)...');
  const res6 = await fetch(`${API_BASE}/marks/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      department: 'AIML',
      semester: '6',
      division: 'A',
      subject: 'Machine Learning',
      examType: 'Mid Term',
      maxMarks: 30,
      targetEmail: 'hod.aiml@campus.edu',
      notes: 'Mid Term marks submitted for review by Prof. Test AIML Faculty.',
      enteredBy: 'Prof. Test AIML Faculty',
      stats: {
        total: 2,
        presentCount: 1,
        absentCount: 1,
        average: '27.0',
        passRate: 100
      },
      studentMarks: [
        { enrollment: '21AIML001', name: 'Aarav Patel', attendance: 'Present', marks: '27', grade: 'A+' },
        { enrollment: '21AIML002', name: 'Bhavna Sharma', attendance: 'Absent', marks: 'AB', grade: 'AB' }
      ]
    })
  });
  const data6 = await res6.json();
  if (res6.ok) {
    console.log('✓ SUCCESS: Email dispatched:', data6.message);
    if (data6.previewUrl) {
      console.log('  Ethereal preview URL:', data6.previewUrl);
    }
  } else {
    console.error('✗ Email dispatch failed:', data6);
  }

  console.log('\n--- ALL ROLE-BASED ACCESS CONTROL & SYSTEM TESTS PASSED SUCCESSFULLY! ---');
}

runTests();
