const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'https://campusai-backend-sfjj.onrender.com/api';

// Date / Pending helpers replicating frontend exactly
function isDuePassed(dueDate, dueTime) {
  if (!dueDate) return false;
  try {
    let year, month, day;
    const cleanDate = dueDate.trim();
    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-').map(Number);
      if (parts[0] > 1000) [year, month, day] = parts;
      else [day, month, year] = parts;
    } else if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/').map(Number);
      if (parts[2] > 1000) [day, month, year] = parts;
      else if (parts[0] > 1000) [year, month, day] = parts;
    }

    let hours = 23;
    let minutes = 59;
    if (dueTime) {
      const timeLower = dueTime.toLowerCase().trim();
      const isPM = timeLower.includes('pm');
      const isAM = timeLower.includes('am');
      const cleanTime = timeLower.replace(/[a-z]/g, '').trim();
      const [hStr, mStr] = cleanTime.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr || '0', 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      if (!isNaN(h)) hours = h;
      if (!isNaN(m)) minutes = m;
    }

    const pad = (n) => String(n).padStart(2, '0');
    const isoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
    const parsed = new Date(isoString);
    if (!isNaN(parsed.getTime())) return new Date() > parsed;
    return new Date() > new Date(`${cleanDate} ${dueTime || ''}`);
  } catch (e) {
    return false;
  }
}

function isAssignmentPending(assignment, studentEnrollment) {
  if (assignment.isSubmitted) return false;
  if (Array.isArray(assignment.submittedBy) && assignment.submittedBy.includes(studentEnrollment)) return false;
  if (isDuePassed(assignment.dueDate, assignment.dueTime)) return false;
  return true;
}

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('END-TO-END ASSIGNMENT SYSTEM VERIFICATION (CAMPUS AI)');
  console.log('================================================================\n');

  const ts = Date.now();

  try {
    // 1. Authenticate / Create Admin
    console.log('STEP 1: Authenticating Admin...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'admin',
      identifier: 'admin'
    });
    const adminToken = adminLogin.data.accessToken;
    console.log('✓ Admin authenticated successfully.\n');

    // 2. Register & Login Faculty (Prof Sharma, AIML)
    console.log('STEP 2: Registering & Authenticating Faculty Member...');
    const facultyUsername = `prof_sharma_${ts}`;
    await axios.post(`${BASE_URL}/auth/register-faculty`, {
      name: 'Dr. R. K. Sharma',
      username: facultyUsername,
      email: `${facultyUsername}@campus.edu`,
      department: 'AIML'
    });
    const facultyLogin = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'faculty',
      identifier: facultyUsername
    });
    const facultyToken = facultyLogin.data.accessToken;
    console.log(`✓ Faculty authenticated: ${facultyUsername} (Department: AIML)\n`);

    // 3. Register & Login Student A (AIML)
    console.log('STEP 3: Registering Student A (AIML)...');
    const studentAEnroll = `AIML_${ts}`;
    await axios.post(`${BASE_URL}/auth/register-student`, {
      name: 'Aarav Patel',
      enrollment: studentAEnroll,
      email: `aarav_${ts}@campus.edu`,
      department: 'AIML'
    });
    const studentALogin = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'student',
      identifier: studentAEnroll
    });
    const studentAToken = studentALogin.data.accessToken;
    console.log(`✓ Student A authenticated: ${studentAEnroll} (AIML)\n`);

    // 4. Register & Login Student B (Cyber Security)
    console.log('STEP 4: Registering Student B (Cyber Security)...');
    const studentBEnroll = `CYBER_${ts}`;
    await axios.post(`${BASE_URL}/auth/register-student`, {
      name: 'Bhavya Nair',
      enrollment: studentBEnroll,
      email: `bhavya_${ts}@campus.edu`,
      department: 'Cyber Security'
    });
    const studentBLogin = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'student',
      identifier: studentBEnroll
    });
    const studentBToken = studentBLogin.data.accessToken;
    console.log(`✓ Student B authenticated: ${studentBEnroll} (Cyber Security)\n`);

    // 5. Faculty Creates Assignment targeted to AIML Students with Questions
    console.log('STEP 5: Faculty creating assignment with Questions and Future Due Date for AIML...');
    const futureDate = '2026-12-31';
    const futureTime = '11:59 PM';
    const testQuestions = `Q1. Explain the Backpropagation Algorithm in Deep Neural Networks.
Q2. Differentiate between L1 and L2 Regularization.
Q3. Implement a simple Convolutional layer in PyTorch or TensorFlow.`;

    const createAssignRes = await axios.post(
      `${BASE_URL}/assignments`,
      {
        title: `Deep Learning Lab Assignment 1 [${ts}]`,
        subject: 'Machine Learning',
        class: 'AIML - Sem 7',
        department: 'AIML',
        targetRole: 'Students',
        dueDate: futureDate,
        dueTime: futureTime,
        questions: testQuestions,
        description: testQuestions
      },
      { headers: { Authorization: `Bearer ${facultyToken}` } }
    );

    const createdAssignment = createAssignRes.data.data;
    console.log(`✓ Assignment created in MongoDB. ID: ${createdAssignment._id}`);
    console.log(`  Title: "${createdAssignment.title}"`);
    console.log(`  Department: ${createdAssignment.department}, TargetRole: ${createdAssignment.targetRole}`);
    console.log(`  Due: ${createdAssignment.dueDate} ${createdAssignment.dueTime}\n`);

    // 6. Student A (AIML) fetches assignments
    console.log('STEP 6: Verifying Student A (AIML) sees the assignment...');
    const stuAAssignmentsRes = await axios.get(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const stuAAssignments = stuAAssignmentsRes.data.data;
    const foundInA = stuAAssignments.find((a) => a._id === createdAssignment._id);
    if (!foundInA) {
      throw new Error(`FAIL: Assignment ${createdAssignment._id} not found in Student A's assignments!`);
    }
    console.log(`✓ Assignment is visible to Student A.`);
    console.log(`  isSubmitted: ${foundInA.isSubmitted} (Pending: ${isAssignmentPending(foundInA, studentAEnroll)})\n`);

    // 7. Verify the EXACT questions appear
    console.log('STEP 7: Verifying the EXACT questions created by Faculty appear...');
    const singleAssignRes = await axios.get(`${BASE_URL}/assignments/${createdAssignment._id}`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const fetchedAssign = singleAssignRes.data.data;
    if (fetchedAssign.questions !== testQuestions) {
      throw new Error('FAIL: Questions do not match the exact text created by faculty!');
    }
    console.log('✓ Questions match identically:\n', fetchedAssign.questions.split('\n').map(l => '    ' + l).join('\n'), '\n');

    // 8. Student A enters answers and submits
    console.log('STEP 8: Student A submitting answers before deadline...');
    const studentAnswers = `Ans 1: Backpropagation computes the gradient of the loss function with respect to weights using the chain rule.
Ans 2: L1 regularization adds absolute weight penalty (leads to sparsity), L2 adds squared weight penalty (weight decay).
Ans 3: torch.nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3, stride=1, padding=1).`;

    const submitRes = await axios.post(
      `${BASE_URL}/assignments/${createdAssignment._id}/submit`,
      { answers: studentAnswers },
      { headers: { Authorization: `Bearer ${studentAToken}` } }
    );
    console.log(`✓ Submission successful: ${submitRes.data.message}`);
    console.log(`  Submission status: ${submitRes.data.data.status}`);
    console.log(`  SubmittedAt: ${submitRes.data.data.submittedAt}\n`);

    // 9. Verify Student A's submission is stored and retrievable via /my-submission
    console.log('STEP 9: Verifying Student A submission details in MongoDB...');
    const mySubRes = await axios.get(
      `${BASE_URL}/assignments/${createdAssignment._id}/my-submission`,
      { headers: { Authorization: `Bearer ${studentAToken}` } }
    );
    const mySub = mySubRes.data.data;
    if (!mySub || mySub.answers !== studentAnswers) {
      throw new Error('FAIL: Stored student submission answers do not match submitted text!');
    }
    console.log('✓ Student submission confirmed in MongoDB with correct student enrollment & answers.\n');

    // 10. Verify Faculty can see Student A's submission and exact answers
    console.log('STEP 10: Faculty reviewing student submissions & answers...');
    const facultySubmissionsRes = await axios.get(
      `${BASE_URL}/assignments/${createdAssignment._id}/submissions`,
      { headers: { Authorization: `Bearer ${facultyToken}` } }
    );
    const facSubData = facultySubmissionsRes.data;
    console.log(`  Stats -> Total Assigned: ${facSubData.stats.totalAssigned}, Submitted: ${facSubData.stats.submittedCount}, Pending: ${facSubData.stats.notSubmittedCount}`);

    const stuARosterEntry = facSubData.roster.find((r) => r.studentEnrollment === studentAEnroll);
    if (!stuARosterEntry || !stuARosterEntry.isSubmitted) {
      throw new Error('FAIL: Student A not listed as Submitted in Faculty roster!');
    }
    if (stuARosterEntry.answers !== studentAnswers) {
      throw new Error('FAIL: Faculty cannot see the exact student answers!');
    }
    console.log(`✓ Faculty can view Student A's exact answers:`);
    console.log(`  Student: ${stuARosterEntry.studentName} (${stuARosterEntry.studentEnrollment})`);
    console.log(`  Submitted At: ${stuARosterEntry.submittedAt}`);
    console.log(`  Answers:\n${stuARosterEntry.answers.split('\n').map(l => '    ' + l).join('\n')}\n`);

    // 11. Verify Student B (Cyber Security) CANNOT see the AIML assignment
    console.log('STEP 11: Verifying Student B (Cyber Security) DOES NOT see the AIML assignment...');
    const stuBAssignmentsRes = await axios.get(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    const foundInB = stuBAssignmentsRes.data.data.find((a) => a._id === createdAssignment._id);
    if (foundInB) {
      throw new Error('FAIL: AIML assignment is incorrectly visible to Cyber Security student!');
    }
    console.log('✓ Department targeting verified: Student B does NOT receive AIML assignment.\n');

    // 12. Test All Departments assignment
    console.log('STEP 12: Testing "All Departments" assignment...');
    const allDeptAssignRes = await axios.post(
      `${BASE_URL}/assignments`,
      {
        title: `Campus-Wide Project Submission [${ts}]`,
        subject: 'General Engineering',
        class: 'All Semesters',
        department: 'All Departments',
        targetRole: 'Students',
        dueDate: futureDate,
        dueTime: futureTime,
        questions: 'Submit your interdisciplinary project abstract.',
        description: 'Submit your interdisciplinary project abstract.'
      },
      { headers: { Authorization: `Bearer ${facultyToken}` } }
    );
    const allDeptAssignId = allDeptAssignRes.data.data._id;

    const stuACheck = (await axios.get(`${BASE_URL}/assignments`, { headers: { Authorization: `Bearer ${studentAToken}` } })).data.data;
    const stuBCheck = (await axios.get(`${BASE_URL}/assignments`, { headers: { Authorization: `Bearer ${studentBToken}` } })).data.data;

    const aHasAll = stuACheck.some(a => a._id === allDeptAssignId);
    const bHasAll = stuBCheck.some(a => a._id === allDeptAssignId);

    if (!aHasAll || !bHasAll) {
      throw new Error('FAIL: All Departments assignment was not received by both students!');
    }
    console.log('✓ Both AIML student and Cyber Security student received the All Departments assignment.\n');

    // 13. Test Admin-created assignment
    console.log('STEP 13: Testing Admin-created assignment...');
    const adminAssignRes = await axios.post(
      `${BASE_URL}/assignments`,
      {
        title: `Annual Ethics & Compliance Quiz [${ts}]`,
        subject: 'Academic Integrity',
        class: 'All Students',
        department: 'All Departments',
        targetRole: 'Students',
        dueDate: futureDate,
        dueTime: futureTime,
        questions: 'State 3 fundamental codes of academic conduct.',
        description: 'State 3 fundamental codes of academic conduct.'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const adminAssign = adminAssignRes.data.data;
    console.log(`✓ Admin assignment created: ID ${adminAssign._id}`);

    // Admin views submissions for it
    const adminReviewRes = await axios.get(
      `${BASE_URL}/assignments/${adminAssign._id}/submissions`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`✓ Admin has full visibility: total eligible students = ${adminReviewRes.data.stats.totalAssigned}\n`);

    // 14. Test Past Due Date Rejection (Both Server-Side and Client Logic)
    console.log('STEP 14: Testing Due Date Expiration rejection on backend...');
    const pastAssignRes = await axios.post(
      `${BASE_URL}/assignments`,
      {
        title: `Expired Assignment [${ts}]`,
        subject: 'Old Course',
        class: 'Class A',
        department: 'AIML',
        targetRole: 'Students',
        dueDate: '2020-01-01', // Clearly in the past
        dueTime: '10:00 AM',
        questions: 'This assignment is already closed.',
        description: 'This assignment is already closed.'
      },
      { headers: { Authorization: `Bearer ${facultyToken}` } }
    );
    const pastAssignId = pastAssignRes.data.data._id;

    // Student A tries to submit to the expired assignment
    try {
      await axios.post(
        `${BASE_URL}/assignments/${pastAssignId}/submit`,
        { answers: 'Late answer attempt' },
        { headers: { Authorization: `Bearer ${studentAToken}` } }
      );
      throw new Error('FAIL: Backend accepted submission for an expired assignment!');
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message.includes('Due date has passed')) {
        console.log(`✓ Backend correctly rejected late submission: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 15. Verify Student Dashboard Pending count consistency
    console.log('\nSTEP 15: Verifying Student Dashboard Pending count consistency...');
    const updatedStuAAssignments = (await axios.get(`${BASE_URL}/assignments`, { headers: { Authorization: `Bearer ${studentAToken}` } })).data.data;
    const pendingItems = updatedStuAAssignments.filter(a => isAssignmentPending(a, studentAEnroll));
    console.log(`✓ Total assignments visible to Student A: ${updatedStuAAssignments.length}`);
    console.log(`✓ Pending assignments count: ${pendingItems.length}`);
    console.log(`✓ Submitted assignments count: ${updatedStuAAssignments.filter(a => a.isSubmitted).length}`);

    // Verify createdAssignment is marked isSubmitted
    const submittedItem = updatedStuAAssignments.find(a => a._id === createdAssignment._id);
    if (!submittedItem || !submittedItem.isSubmitted) {
      throw new Error('FAIL: createdAssignment is not marked isSubmitted!');
    }
    console.log(`✓ Submitted assignment correctly marked as isSubmitted: true (not counted in pending).`);

    // Verify expired assignment is NOT counted in pending
    const expiredItem = updatedStuAAssignments.find(a => a._id === pastAssignId);
    if (expiredItem && isAssignmentPending(expiredItem, studentAEnroll)) {
      throw new Error('FAIL: Expired assignment incorrectly counted in pending!');
    }
    console.log(`✓ Expired assignment correctly excluded from pending.`);

    console.log('\n================================================================');
    console.log('ALL ASSIGNMENT SYSTEM TESTS PASSED SUCCESSFULLY! (100% VERIFIED)');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

runEndToEndVerification();
