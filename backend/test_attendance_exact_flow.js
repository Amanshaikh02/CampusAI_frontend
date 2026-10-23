const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'https://campusai-backend-sfjj.onrender.com/api';

async function runTest() {
  console.log('=== STARTING COMPLETE ATTENDANCE WORKFLOW TEST ===\n');

  try {
    // 1. Authenticate Harsh Shah
    console.log('1. Logging in as Faculty Harsh Shah...');
    const facLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      role: 'faculty',
      identifier: 'hshah',
      password: 'password123'
    });
    const facToken = facLoginRes.data.token || facLoginRes.data.accessToken;
    console.log('✔ Harsh Shah logged in successfully.');

    const facHeaders = { Authorization: `Bearer ${facToken}` };

    // 2. Fetch Harsh Shah's assigned subjects
    console.log('\n2. Fetching Harsh Shah assigned subjects...');
    const subjectsRes = await axios.get(`${API_BASE}/attendance/my-subjects`, { headers: facHeaders });
    const mySubjects = subjectsRes.data.data;
    console.log(`✔ Assigned subjects count: ${mySubjects.length}`);
    const mernAssignment = mySubjects.find((s) => s.subject.toUpperCase() === 'MERN');
    if (!mernAssignment) {
      throw new Error('MERN assignment not found for Harsh Shah!');
    }
    console.log(`✔ Found MERN assignment: ID ${mernAssignment._id}, Dept: ${mernAssignment.department}, Sem: ${mernAssignment.semester}`);

    // 3. Fetch student roster for MERN on date 2026-10-05
    console.log('\n3. Fetching student roster for Harsh Shah -> MERN (AIML Sem 7)...');
    const rosterRes = await axios.get(`${API_BASE}/attendance/roster`, {
      params: { assignmentId: mernAssignment._id, date: '2026-10-05' },
      headers: facHeaders
    });
    const roster = rosterRes.data.roster || rosterRes.data.students || [];
    console.log(`✔ Roster students count: ${roster.length}`);
    const enrollments = roster.map((s) => s.enrollment);
    console.log('✔ Roster enrollments:', enrollments);

    // Verify Amaan Shaikh is present in the roster
    const amaanInRoster = roster.find((s) => s.enrollment === 'AIML001');
    if (!amaanInRoster) throw new Error('Amaan Shaikh (AIML001) is missing from MERN Sem 7 roster!');
    console.log('✔ PASS: Amaan Shaikh (AIML001) is present in Harsh Shah roster.');

    // Verify Cyber Security student is NOT present
    const cyberInRoster = roster.find((s) => s.enrollment === 'CYBER001');
    if (cyberInRoster) throw new Error('FAIL: Cyber Security student CYBER001 was found in AIML roster!');
    console.log('✔ PASS: Cyber Security student (CYBER001) is NOT in AIML roster.');

    // Verify Sem 6 AIML student is NOT present
    const sem6InRoster = roster.find((s) => s.enrollment === 'AIML006');
    if (sem6InRoster) throw new Error('FAIL: Sem 6 student AIML006 was found in Sem 7 roster!');
    console.log('✔ PASS: Sem 6 student (AIML006) is NOT in Sem 7 roster.');

    // 4. Lecture 1: Mark Amaan Shaikh Present on 2026-10-05
    console.log('\n4. Lecture 1: Marking Amaan Shaikh Present on 2026-10-05...');
    const lecture1Records = roster.map((s) => ({
      studentId: s.studentId || s._id,
      name: s.studentName || s.name,
      enrollment: s.enrollment,
      status: s.enrollment === 'AIML001' ? 'Present' : 'Present'
    }));

    const save1Res = await axios.post(
      `${API_BASE}/attendance/session`,
      {
        assignmentId: mernAssignment._id,
        date: '2026-10-05',
        records: lecture1Records,
        lectureTopic: 'React Architecture and State'
      },
      { headers: facHeaders }
    );
    console.log('✔ Saved Lecture 1 attendance session successfully:', save1Res.data.message);

    // 5. Login as Amaan Shaikh and check student attendance
    console.log('\n5. Logging in as Student Amaan Shaikh...');
    const studentLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      role: 'student',
      identifier: 'AIML001',
      password: 'password123'
    });
    const studentToken = studentLoginRes.data.token || studentLoginRes.data.accessToken;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    console.log('Fetching Amaan Shaikh attendance summary...');
    const attRes1 = await axios.get(`${API_BASE}/attendance/my`, { headers: studentHeaders });
    const studentSummary1 = attRes1.data.summary;
    const mernSummary1 = studentSummary1.find((s) => s.subject.toUpperCase() === 'MERN');

    console.log('MERN Stats after Lecture 1:', {
      totalLectures: mernSummary1.totalLectures,
      present: mernSummary1.present,
      absent: mernSummary1.absent,
      percentage: mernSummary1.percentage
    });

    if (
      mernSummary1.totalLectures !== 1 ||
      mernSummary1.present !== 1 ||
      mernSummary1.absent !== 0 ||
      mernSummary1.percentage !== '100.00%'
    ) {
      throw new Error(`FAIL: Expected 1 total, 1 present, 0 absent, 100%, but got: ${JSON.stringify(mernSummary1)}`);
    }
    console.log('✔ PASS: Amaan Shaikh shows 1 Total, 1 Present, 0 Absent, 100.00%');

    // 6. Lecture 2: Mark Amaan Shaikh Absent on 2026-10-06
    console.log('\n6. Lecture 2: Harsh Shah marks Amaan Shaikh Absent on 2026-10-06...');
    const lecture2Records = roster.map((s) => ({
      studentId: s.studentId || s._id,
      name: s.studentName || s.name,
      enrollment: s.enrollment,
      status: s.enrollment === 'AIML001' ? 'Absent' : 'Present'
    }));

    await axios.post(
      `${API_BASE}/attendance/session`,
      {
        assignmentId: mernAssignment._id,
        date: '2026-10-06',
        records: lecture2Records,
        lectureTopic: 'Redux and Context API'
      },
      { headers: facHeaders }
    );
    console.log('✔ Saved Lecture 2 attendance session successfully.');

    // 7. Check Amaan Shaikh attendance summary again
    console.log('\n7. Fetching Amaan Shaikh attendance summary after Lecture 2...');
    const attRes2 = await axios.get(`${API_BASE}/attendance/my`, { headers: studentHeaders });
    const studentSummary2 = attRes2.data.summary;
    const mernSummary2 = studentSummary2.find((s) => s.subject.toUpperCase() === 'MERN');

    console.log('MERN Stats after Lecture 2:', {
      totalLectures: mernSummary2.totalLectures,
      present: mernSummary2.present,
      absent: mernSummary2.absent,
      percentage: mernSummary2.percentage
    });

    if (
      mernSummary2.totalLectures !== 2 ||
      mernSummary2.present !== 1 ||
      mernSummary2.absent !== 1 ||
      mernSummary2.percentage !== '50.00%'
    ) {
      throw new Error(`FAIL: Expected 2 total, 1 present, 1 absent, 50.00%, but got: ${JSON.stringify(mernSummary2)}`);
    }
    console.log('✔ PASS: Amaan Shaikh shows 2 Total, 1 Present, 1 Absent, 50.00%');

    // 8. Test Daily History Detail for Amaan Shaikh
    console.log('\n8. Checking Daily History for MERN:');
    console.log(mernSummary2.dailyHistory);
    if (mernSummary2.dailyHistory.length !== 2) {
      throw new Error(`FAIL: Expected 2 daily history records, got ${mernSummary2.dailyHistory.length}`);
    }
    console.log('✔ PASS: Student daily history contains both lecture sessions.');

    // 9. Test Authorization: Another faculty cannot modify Harsh Shah's MERN attendance
    console.log('\n9. Testing unauthorized faculty access...');
    const otherFacLogin = await axios.post(`${API_BASE}/auth/login`, {
      role: 'faculty',
      identifier: 'prof_abc',
      password: 'password123'
    });
    const otherToken = otherFacLogin.data.token || otherFacLogin.data.accessToken;
    const otherHeaders = { Authorization: `Bearer ${otherToken}` };

    try {
      await axios.post(
        `${API_BASE}/attendance/session`,
        {
          assignmentId: mernAssignment._id,
          date: '2026-10-07',
          records: lecture1Records
        },
        { headers: otherHeaders }
      );
      throw new Error('FAIL: Unauthorized faculty was permitted to mark attendance for Harsh Shah!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✔ PASS: Another faculty received 403 Forbidden as expected!');
      } else {
        throw err;
      }
    }

    console.log('\n==================================================');
    console.log('🎉 ALL ATTENDANCE SCENARIO TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
