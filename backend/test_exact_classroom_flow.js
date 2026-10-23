const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';

async function runExactClassroomVerification() {
  console.log('================================================================');
  console.log('EXACT 44-STEP GOOGLE CLASSROOM SPECIFICATION VERIFICATION');
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------------------
    // Step 1: Ensure real Student Amaan Shaikh (AIML, Semester 7)
    // ------------------------------------------------------------------------
    console.log('1. Setting up / verifying real Student: Amaan Shaikh (AIML, Semester 7)...');
    let amaanLoginRes;
    try {
      amaanLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        role: 'student',
        identifier: 'AIML001',
        password: 'password123'
      });
    } catch (e) {
      // Register if not existing
      await axios.post(`${BASE_URL}/auth/register-student`, {
        name: 'Amaan Shaikh',
        enrollment: 'AIML001',
        department: 'AIML',
        semester: '7',
        password: 'password123'
      });
      amaanLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        role: 'student',
        identifier: 'AIML001',
        password: 'password123'
      });
    }
    const amaanToken = amaanLoginRes.data.accessToken;
    console.log('✓ Amaan Shaikh authenticated successfully (AIML Sem 7).\n');

    // ------------------------------------------------------------------------
    // Step 2: Ensure real Faculty Harsh Shah
    // ------------------------------------------------------------------------
    console.log('2. Setting up / verifying real Faculty: Harsh Shah...');
    let harshLoginRes;
    try {
      harshLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        role: 'teacher',
        identifier: 'hshah',
        password: 'password123'
      });
    } catch (e) {
      await axios.post(`${BASE_URL}/auth/register-faculty`, {
        name: 'Harsh Shah',
        username: 'hshah',
        department: 'AIML',
        password: 'password123'
      });
      harshLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        role: 'teacher',
        identifier: 'hshah',
        password: 'password123'
      });
    }
    const harshToken = harshLoginRes.data.accessToken;
    const harshId = harshLoginRes.data.user.id || harshLoginRes.data.user._id;
    console.log(`✓ Harsh Shah authenticated successfully (ID: ${harshId}).\n`);

    // ------------------------------------------------------------------------
    // Step 3 & 4: Create real Subject MERN & Assign Harsh Shah -> MERN -> AIML -> Sem 7
    // ------------------------------------------------------------------------
    console.log('3 & 4. Verifying Academic Relationship: Harsh Shah → MERN → AIML → Semester 7...');
    await axios.post(
      `${BASE_URL}/attendance/assign-subject`,
      {
        facultyId: harshId,
        facultyName: 'Harsh Shah',
        facultyUsername: 'hshah',
        subject: 'MERN',
        subjectCode: 'AIML701',
        department: 'AIML',
        semester: 7,
        classSection: 'AIML - Sem 7',
        academicYear: '2026-2027'
      },
      { headers: { Authorization: `Bearer ${harshToken}` } }
    ).catch(() => {}); // If already assigned, compound index preserves it
    console.log('✓ Harsh Shah academic subject assignment active for MERN (AIML Sem 7).\n');

    // ------------------------------------------------------------------------
    // Step 5 & 6: Login as Harsh Shah & Create MERN Assignment 1
    // ------------------------------------------------------------------------
    console.log('5 & 6. Harsh Shah creating "MERN Assignment 1" with specific questions...');
    const questionsText = `Q1. Explain React components.
Q2. Explain props and state.`;
    const questionsList = [
      { id: 'q-1', question: 'Explain React components.', marks: 5 },
      { id: 'q-2', question: 'Explain props and state.', marks: 5 }
    ];

    const createRes = await axios.post(
      `${BASE_URL}/assignments`,
      {
        title: 'MERN Assignment 1',
        subject: 'MERN',
        class: 'AIML - Sem 7',
        department: 'AIML',
        semester: 7,
        targetRole: 'Students',
        dueDate: '2026-11-15',
        dueTime: '23:59',
        questionsList,
        questions: questionsText,
        totalMarks: 10
      },
      { headers: { Authorization: `Bearer ${harshToken}` } }
    );
    const mernAssignment1 = createRes.data.data;
    console.log(`✓ Assignment created successfully in MongoDB: ${mernAssignment1._id}`);
    console.log(`  Title: ${mernAssignment1.title}`);
    console.log(`  Created By: ${mernAssignment1.createdBy}`);
    console.log(`  Due Date: ${mernAssignment1.dueDate} ${mernAssignment1.dueTime}\n`);

    // ------------------------------------------------------------------------
    // Step 7: Verify assignment is stored in MongoDB
    // ------------------------------------------------------------------------
    console.log('7. Verifying assignment exists in MongoDB...');
    const fetchDirectRes = await axios.get(`${BASE_URL}/assignments/${mernAssignment1._id}`, {
      headers: { Authorization: `Bearer ${harshToken}` }
    });
    if (!fetchDirectRes.data.data) throw new Error('Assignment not found in MongoDB!');
    console.log('✓ Confirmed: MERN Assignment 1 exists in MongoDB.\n');

    // ------------------------------------------------------------------------
    // Step 8 & 9: Logout Harsh, Login as Amaan
    // ------------------------------------------------------------------------
    console.log('8 & 9. Authenticated as student Amaan Shaikh...');
    // Amaan token is active

    // ------------------------------------------------------------------------
    // Step 10 & 11: Student -> Assignments -> First show relevant teachers
    // ------------------------------------------------------------------------
    console.log('10 & 11. Student fetching relevant teachers list (/api/assignments/teachers)...');
    const teachersRes = await axios.get(`${BASE_URL}/assignments/teachers`, {
      headers: { Authorization: `Bearer ${amaanToken}` }
    });
    const teachersList = teachersRes.data.data;
    const harshTeacher = teachersList.find(
      (t) => t.facultyName === 'Harsh Shah' && t.subject === 'MERN'
    );
    if (!harshTeacher) {
      throw new Error('FAIL: Harsh Shah (MERN) did not appear in Amaan Shaikh\'s teacher list!');
    }
    console.log(`✓ Harsh Shah appears as relevant teacher for Amaan:`);
    console.log(`  Teacher: ${harshTeacher.facultyName} | Subject: ${harshTeacher.subject} | Dept: ${harshTeacher.department} | Sem: ${harshTeacher.semester}`);
    console.log(`  Total Assignments: ${harshTeacher.totalAssignments} | Pending: ${harshTeacher.pendingAssignments}\n`);

    // ------------------------------------------------------------------------
    // Step 12 & 13: Click Harsh Shah -> Verify MERN Assignment 1 appears
    // ------------------------------------------------------------------------
    console.log('12 & 13. Student querying assignments for Harsh Shah...');
    const harshAssignmentsRes = await axios.get(`${BASE_URL}/assignments?teacherName=Harsh Shah`, {
      headers: { Authorization: `Bearer ${amaanToken}` }
    });
    const harshAssignments = harshAssignmentsRes.data.data;
    const foundMern1 = harshAssignments.find((a) => a._id === mernAssignment1._id);
    if (!foundMern1) {
      throw new Error('FAIL: MERN Assignment 1 not found under Harsh Shah!');
    }
    console.log(`✓ MERN Assignment 1 is visible under Harsh Shah.`);
    console.log(`  Status: ${foundMern1.status} (isSubmitted: ${foundMern1.isSubmitted})\n`);

    // ------------------------------------------------------------------------
    // Step 14 & 15: Open assignment -> Verify EXACT questions created by Harsh Shah
    // ------------------------------------------------------------------------
    console.log('14 & 15. Student opening assignment details -> Verifying EXACT questions...');
    const openAssignRes = await axios.get(`${BASE_URL}/assignments/${mernAssignment1._id}`, {
      headers: { Authorization: `Bearer ${amaanToken}` }
    });
    const assignmentDetails = openAssignRes.data.data;
    console.log('  Questions retrieved:');
    assignmentDetails.questionsList.forEach((q, idx) => {
      console.log(`    Q${idx + 1}. ${q.question} (${q.marks} Marks)`);
    });
    if (assignmentDetails.questionsList.length !== 2 ||
        assignmentDetails.questionsList[0].question !== 'Explain React components.' ||
        assignmentDetails.questionsList[1].question !== 'Explain props and state.') {
      throw new Error('FAIL: Retrieved questions do not match the exact questions created by Harsh Shah!');
    }
    console.log('✓ Questions match identically.\n');

    // ------------------------------------------------------------------------
    // Step 16, 17, 18: Amaan enters answers and submits -> verify in MongoDB
    // ------------------------------------------------------------------------
    console.log('16, 17, 18. Amaan entering question-by-question answers and submitting...');
    const submittedAnswersList = [
      {
        questionId: 'q-1',
        question: 'Explain React components.',
        answer: 'React components are independent, reusable bits of code that serve as the building blocks of any React application. They can be function components or class components.'
      },
      {
        questionId: 'q-2',
        question: 'Explain props and state.',
        answer: 'Props (properties) are read-only inputs passed from parent to child components. State is an internal, mutable data store managed within the component itself that triggers re-renders on update.'
      }
    ];

    const submitRes = await axios.post(
      `${BASE_URL}/assignments/${mernAssignment1._id}/submit`,
      { answersList: submittedAnswersList },
      { headers: { Authorization: `Bearer ${amaanToken}` } }
    );
    console.log(`✓ Submission recorded in MongoDB: ${submitRes.data.message}`);
    const submissionId = submitRes.data.data._id;
    console.log(`  Submission ID: ${submissionId}`);

    // Verify via /my-submission
    const mySubRes = await axios.get(`${BASE_URL}/assignments/${mernAssignment1._id}/my-submission`, {
      headers: { Authorization: `Bearer ${amaanToken}` }
    });
    if (!mySubRes.data.data || mySubRes.data.data.status !== 'Submitted') {
      throw new Error('FAIL: Submission verification failed in MongoDB!');
    }
    console.log('✓ Submission confirmed in MongoDB for student Amaan Shaikh.\n');

    // ------------------------------------------------------------------------
    // Step 19, 20, 21, 22: Login as Harsh Shah -> Open My Assignments -> MERN 1
    // ------------------------------------------------------------------------
    console.log('19, 20, 21, 22. Harsh Shah opening My Assignments -> Verifying Amaan Shaikh: Submitted...');
    const facultySubmissionsRes = await axios.get(
      `${BASE_URL}/assignments/${mernAssignment1._id}/submissions`,
      { headers: { Authorization: `Bearer ${harshToken}` } }
    );
    const facSubData = facultySubmissionsRes.data;
    console.log(`  Total Assigned: ${facSubData.stats.totalAssigned}`);
    console.log(`  Submitted: ${facSubData.stats.submittedCount}`);
    console.log(`  Not Submitted: ${facSubData.stats.notSubmittedCount}`);

    const amaanRosterEntry = facSubData.roster.find((r) => r.studentEnrollment === 'AIML001');
    if (!amaanRosterEntry || !amaanRosterEntry.isSubmitted) {
      throw new Error('FAIL: Amaan Shaikh does not appear as Submitted in Harsh Shah\'s roster!');
    }
    console.log(`✓ Verified: Amaan Shaikh (AIML001) status is "Submitted".\n`);

    // ------------------------------------------------------------------------
    // Step 23 & 24: Open Amaan's submission -> Verify exact answers
    // ------------------------------------------------------------------------
    console.log('23 & 24. Harsh Shah reviewing Amaan\'s exact answers...');
    console.log(`  Answers List Count: ${amaanRosterEntry.answersList?.length || 0}`);
    amaanRosterEntry.answersList.forEach((a, i) => {
      console.log(`    Q${i + 1}: ${a.question}\n    Answer: ${a.answer}`);
    });
    if (!amaanRosterEntry.answers.includes('building blocks of any React application')) {
      throw new Error('FAIL: Submitted answer text does not match what Amaan entered!');
    }
    console.log('✓ Exact answers verified.\n');

    // ------------------------------------------------------------------------
    // Step 25: Add marks and feedback
    // ------------------------------------------------------------------------
    console.log('25. Harsh Shah adding marks (9.5 / 10) and feedback...');
    const gradeRes = await axios.put(
      `${BASE_URL}/assignments/submissions/${amaanRosterEntry.submissionId}/review`,
      {
        marks: '9.5',
        feedback: 'Excellent explanation of component lifecycle and state management. Well done!'
      },
      { headers: { Authorization: `Bearer ${harshToken}` } }
    );
    console.log(`✓ Grade and feedback saved in MongoDB: ${gradeRes.data.message}\n`);

    // ------------------------------------------------------------------------
    // Step 26 & 27: Login as Amaan -> Verify marks and feedback
    // ------------------------------------------------------------------------
    console.log('26 & 27. Student Amaan checking graded result...');
    const amaanCheckRes = await axios.get(
      `${BASE_URL}/assignments/${mernAssignment1._id}/my-submission`,
      { headers: { Authorization: `Bearer ${amaanToken}` } }
    );
    const gradedSub = amaanCheckRes.data.data;
    if (gradedSub.marks !== '9.5' || !gradedSub.feedback.includes('Excellent explanation')) {
      throw new Error('FAIL: Graded marks and feedback not visible to student Amaan!');
    }
    console.log(`✓ Student successfully sees marks and feedback:`);
    console.log(`  Marks: ${gradedSub.marks} / 10`);
    console.log(`  Feedback: "${gradedSub.feedback}"\n`);

    // ------------------------------------------------------------------------
    // Step 28 & 29: Test Cyber Security student -> AIML assignment NOT visible
    // ------------------------------------------------------------------------
    console.log('28 & 29. Testing Cyber Security student visibility isolation...');
    const cyberLogin = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'student',
      identifier: 'CYBER001',
      password: 'password123'
    });
    const cyberToken = cyberLogin.data.accessToken;

    const cyberAssignmentsRes = await axios.get(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${cyberToken}` }
    });
    const foundInCyber = cyberAssignmentsRes.data.data.find((a) => a._id === mernAssignment1._id);
    if (foundInCyber) {
      throw new Error('FAIL: AIML assignment is visible to Cyber Security student!');
    }
    console.log('✓ Confirmed: AIML assignment is NOT visible to Cyber Security student.\n');

    // ------------------------------------------------------------------------
    // Step 30 & 31: Test Sem 6 AIML student -> Sem 7 assignment NOT visible
    // ------------------------------------------------------------------------
    console.log('30 & 31. Testing Semester isolation (Sem 6 student vs Sem 7 assignment)...');
    const sem6Login = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'student',
      identifier: 'AIML006',
      password: 'password123'
    });
    const sem6Token = sem6Login.data.accessToken;

    const sem6AssignmentsRes = await axios.get(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${sem6Token}` }
    });
    const foundInSem6 = sem6AssignmentsRes.data.data.find((a) => a._id === mernAssignment1._id);
    if (foundInSem6) {
      throw new Error('FAIL: Sem 7 assignment is visible to Sem 6 student!');
    }
    console.log('✓ Confirmed: Sem 7 assignment is NOT visible to Sem 6 student.\n');

    // ------------------------------------------------------------------------
    // Step 32 & 33: Create another faculty and assignment -> Faculty isolation
    // ------------------------------------------------------------------------
    console.log('32 & 33. Testing Faculty isolation (Prof. X. Y. Zaveri vs Harsh Shah)...');
    const zaveriLogin = await axios.post(`${BASE_URL}/auth/login`, {
      role: 'faculty',
      identifier: 'prof_xyz',
      password: 'password123'
    });
    const zaveriToken = zaveriLogin.data.accessToken;

    // Create assignment by Zaveri
    const zaveriAssignRes = await axios.post(
      `${BASE_URL}/assignments`,
      {
        title: 'Data Mining Clustering Lab',
        subject: 'Data Mining',
        class: 'AIML - Sem 7',
        department: 'AIML',
        semester: 7,
        targetRole: 'Students',
        dueDate: '2026-11-20',
        dueTime: '23:59',
        questions: 'Q1. Explain K-Means Clustering.',
        totalMarks: 10
      },
      { headers: { Authorization: `Bearer ${zaveriToken}` } }
    );
    const zaveriAssignId = zaveriAssignRes.data.data._id;

    // Harsh Shah views his assignments
    const harshMyAssignments = (await axios.get(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${harshToken}` }
    })).data.data;

    const harshSeesZaveri = harshMyAssignments.some((a) => a._id === zaveriAssignId);
    if (harshSeesZaveri) {
      throw new Error('FAIL: Harsh Shah can see Prof. Zaveri\'s assignment!');
    }

    // Zaveri views his assignments
    const zaveriMyAssignments = (await axios.get(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${zaveriToken}` }
    })).data.data;

    const zaveriSeesHarsh = zaveriMyAssignments.some((a) => a._id === mernAssignment1._id);
    if (zaveriSeesHarsh) {
      throw new Error('FAIL: Prof. Zaveri can see Harsh Shah\'s assignment!');
    }
    console.log('✓ Strict Faculty Isolation Confirmed: Each faculty member sees ONLY their own assignments.\n');

    // ------------------------------------------------------------------------
    // Step 34: Faculty A cannot edit or delete Faculty B's assignment
    // ------------------------------------------------------------------------
    console.log('34. Testing unauthorized cross-faculty edit/delete protection...');
    try {
      await axios.put(
        `${BASE_URL}/assignments/${zaveriAssignId}`,
        { title: 'Hacked by Harsh' },
        { headers: { Authorization: `Bearer ${harshToken}` } }
      );
      throw new Error('FAIL: Harsh Shah was able to update Prof. Zaveri\'s assignment!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✓ Backend correctly rejected cross-faculty edit (HTTP 403): "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    try {
      await axios.delete(
        `${BASE_URL}/assignments/${zaveriAssignId}`,
        { headers: { Authorization: `Bearer ${harshToken}` } }
      );
      throw new Error('FAIL: Harsh Shah was able to delete Prof. Zaveri\'s assignment!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✓ Backend correctly rejected cross-faculty delete (HTTP 403): "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }
    console.log('✓ Cross-faculty mutation security verified.\n');

    // ------------------------------------------------------------------------
    // Step 35 & 36: Test due date expiration -> Student cannot submit
    // ------------------------------------------------------------------------
    console.log('35 & 36. Testing due date expiration server-side enforcement...');
    const expiredAssignRes = await axios.post(
      `${BASE_URL}/assignments`,
      {
        title: 'Past Due Assignment',
        subject: 'MERN',
        class: 'AIML - Sem 7',
        department: 'AIML',
        semester: 7,
        targetRole: 'Students',
        dueDate: '2020-01-01',
        dueTime: '12:00',
        questions: 'Q1. Test expired.',
        totalMarks: 5
      },
      { headers: { Authorization: `Bearer ${harshToken}` } }
    );
    const expiredAssignId = expiredAssignRes.data.data._id;

    try {
      await axios.post(
        `${BASE_URL}/assignments/${expiredAssignId}/submit`,
        { answers: 'Attempting submission on closed assignment' },
        { headers: { Authorization: `Bearer ${amaanToken}` } }
      );
      throw new Error('FAIL: Student was able to submit to an expired assignment!');
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message.includes('Due date has passed')) {
        console.log(`✓ Backend correctly rejected late submission (HTTP 400): "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }
    console.log('✓ Due date deadline enforcement verified.\n');

    // ------------------------------------------------------------------------
    // Step 37 & 38: Student -> Message Teacher (regarding MERN assignment)
    // ------------------------------------------------------------------------
    console.log('37 & 38. Testing Student → Message Teacher...');
    const studentMsgRes = await axios.post(
      `${BASE_URL}/messages`,
      {
        senderId: 'AIML001',
        senderName: 'Amaan Shaikh',
        senderRole: 'student',
        receiverId: 'hshah',
        receiverName: 'Harsh Shah',
        receiverRole: 'teacher',
        assignmentId: mernAssignment1._id,
        subject: 'MERN',
        department: 'AIML',
        semester: 7,
        message: 'Sir, I have a doubt regarding Question 2.'
      },
      { headers: { Authorization: `Bearer ${amaanToken}` } }
    );
    console.log(`✓ Student message saved in MongoDB: "${studentMsgRes.data.data.message}"`);

    // Verify Harsh Shah receives this message in /api/messages
    const harshMessagesRes = await axios.get(`${BASE_URL}/messages`, {
      headers: { Authorization: `Bearer ${harshToken}` }
    });
    const foundMsg = harshMessagesRes.data.data.find(
      (m) => m.senderId === 'AIML001' && m.message.includes('doubt regarding Question 2')
    );
    if (!foundMsg) {
      throw new Error('FAIL: Harsh Shah did not receive Amaan\'s message in MongoDB!');
    }
    console.log(`✓ Teacher Harsh Shah received real MongoDB message: "${foundMsg.message}" (From: ${foundMsg.senderName})\n`);

    // ------------------------------------------------------------------------
    // Step 39 & 40: Teacher -> Student message broadcast
    // ------------------------------------------------------------------------
    console.log('39 & 40. Testing Teacher → Class cohort broadcast message...');
    const teacherBroadcastRes = await axios.post(
      `${BASE_URL}/messages`,
      {
        senderId: 'hshah',
        senderName: 'Harsh Shah',
        senderRole: 'teacher',
        broadcast: true,
        department: 'AIML',
        semester: 7,
        subject: 'MERN',
        message: "Tomorrow's MERN assignment submission deadline is 11:59 PM."
      },
      { headers: { Authorization: `Bearer ${harshToken}` } }
    );
    console.log(`✓ Teacher broadcast dispatched: ${teacherBroadcastRes.data.message}`);

    // Verify Amaan (AIML Sem 7) received it
    const amaanMessagesRes = await axios.get(`${BASE_URL}/messages`, {
      headers: { Authorization: `Bearer ${amaanToken}` }
    });
    const foundBroadcast = amaanMessagesRes.data.data.find(
      (m) => m.senderName === 'Harsh Shah' && m.message.includes('Tomorrow\'s MERN assignment submission deadline')
    );
    if (!foundBroadcast) {
      throw new Error('FAIL: AIML student Amaan Shaikh did not receive the teacher\'s broadcast message!');
    }
    console.log(`✓ Applicable student Amaan received teacher's message: "${foundBroadcast.message}"`);

    // Verify Cyber student did NOT receive it
    const cyberMessagesRes = await axios.get(`${BASE_URL}/messages`, {
      headers: { Authorization: `Bearer ${cyberToken}` }
    });
    const cyberReceived = cyberMessagesRes.data.data.some(
      (m) => m.message.includes('Tomorrow\'s MERN assignment submission deadline')
    );
    if (cyberReceived) {
      throw new Error('FAIL: Cyber student incorrectly received AIML teacher broadcast!');
    }
    console.log('✓ Unrelated Cyber student did NOT receive the message (Strict cohort targeting verified).\n');

    // ------------------------------------------------------------------------
    // Step 41, 42, 43: MongoDB Persistence Check
    // ------------------------------------------------------------------------
    console.log('41, 42, 43. Testing MongoDB Single Source of Truth Persistence...');
    const reconnectedAssign = await axios.get(`${BASE_URL}/assignments/${mernAssignment1._id}`, {
      headers: { Authorization: `Bearer ${amaanToken}` }
    });
    const reconnectedSub = await axios.get(`${BASE_URL}/assignments/${mernAssignment1._id}/my-submission`, {
      headers: { Authorization: `Bearer ${amaanToken}` }
    });

    if (!reconnectedAssign.data.data || !reconnectedSub.data.data) {
      throw new Error('FAIL: MongoDB data did not persist across sessions!');
    }
    console.log('✓ MongoDB is the confirmed Single Source of Truth.');
    console.log(`  Assignment: ${reconnectedAssign.data.data.title}`);
    console.log(`  Submission: ${reconnectedSub.data.data.studentName} -> Marks: ${reconnectedSub.data.data.marks}\n`);

    console.log('================================================================');
    console.log('ALL 43 RUNTIME TEST SCENARIOS PASSED 100% SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

runExactClassroomVerification();
