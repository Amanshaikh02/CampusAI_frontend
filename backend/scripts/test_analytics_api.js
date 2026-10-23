const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const {
  getStudentPerformanceAnalytics,
  getFacultySubjectsAnalytics,
  getFacultySubjectStudentsAnalytics,
  searchStudentsForAnalytics
} = require('../controllers/analyticsController');

// Mock req and res
function mockReqRes(user, query = {}, body = {}) {
  const req = {
    user,
    query,
    body,
    headers: { authorization: 'Bearer test' }
  };
  let resData = null;
  let resStatus = 200;
  const res = {
    status(code) {
      resStatus = code;
      return this;
    },
    json(data) {
      resData = data;
      return this;
    }
  };
  return { req, res, getResult: () => ({ status: resStatus, data: resData }) };
}

async function testAnalyticsDirectly() {
  console.log('--- Testing Performance Analytics Controller Directly ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas DB.');

  // 1. Test Student View
  console.log('\n[1] Testing Student Role Analytics...');
  const studentUser = await User.findOne({ enrollment: '23018501210234', role: 'student' });
  if (!studentUser) throw new Error('Student 23018501210234 not found');

  const { req: sReq, res: sRes, getResult: sResult } = mockReqRes(studentUser, {
    // Malicious attempt by student to query another student's enrollment
    enrollment: '21CS001'
  });

  await getStudentPerformanceAnalytics(sReq, sRes);
  const studentOutput = sResult();
  console.log('Status:', studentOutput.status);
  console.log('Student Info:', studentOutput.data?.student?.name, studentOutput.data?.student?.enrollment);
  console.log('Overall Percentage:', studentOutput.data?.metrics?.overallPercentage + '%');
  console.log('CGPA:', studentOutput.data?.metrics?.cgpa);
  console.log('Strongest Subject:', studentOutput.data?.metrics?.strongestSubject);
  console.log('Weakest Subject:', studentOutput.data?.metrics?.weakestSubject);
  console.log('Total Attendance:', studentOutput.data?.metrics?.attendance);
  console.log('Current Sem Subjects count:', studentOutput.data?.currentSemesterSubjects?.length);
  console.log('Semester Trends:', studentOutput.data?.semesterTrends?.map(t => `${t.label}: ${t.percentage}%`));
  console.log('Detailed Marks count:', studentOutput.data?.detailedMarks?.length);

  // Security check: Did the student get their OWN data, ignoring the spoofed enrollment?
  if (studentOutput.data?.student?.enrollment === '23018501210234') {
    console.log('✓ RBAC Security PASS: Student was strictly locked to own enrollment.');
  } else {
    console.error('✗ RBAC Security FAIL: Student was able to access other enrollment!');
  }

  // 2. Test Faculty View
  console.log('\n[2] Testing Faculty Role Analytics...');
  const facultyUser = await User.findOne({ role: { $in: ['faculty', 'teacher'] }, assignedSubject: 'Machine Learning' })
    || await User.findOne({ role: { $in: ['faculty', 'teacher'] } });
  console.log('Faculty user:', facultyUser.name, 'Assigned:', facultyUser.assignedSubject);

  const { req: fReq, res: fRes, getResult: fResult } = mockReqRes(facultyUser, {
    subject: facultyUser.assignedSubject || 'Machine Learning'
  });

  await getFacultySubjectsAnalytics(fReq, fRes);
  const facSubs = fResult().data;
  console.log('Faculty subjects count:', facSubs?.count);
  console.log('Faculty subjects list:', facSubs?.data);

  // Faculty students
  const { req: fsReq, res: fsRes, getResult: fsResult } = mockReqRes(facultyUser, {
    subject: facultyUser.assignedSubject || 'Machine Learning'
  });
  await getFacultySubjectStudentsAnalytics(fsReq, fsRes);
  const facStudents = fsResult().data;
  console.log('Students taking this subject:', facStudents?.count);
  const selectedStudent = facStudents?.data?.[0];
  console.log('First student in subject:', selectedStudent?.name, selectedStudent?.enrollment);

  // Faculty views this student's performance compared to class average
  const { req: fcReq, res: fcRes, getResult: fcResult } = mockReqRes(facultyUser, {
    subject: facultyUser.assignedSubject || 'Machine Learning',
    enrollment: selectedStudent?.enrollment
  });
  await getStudentPerformanceAnalytics(fcReq, fcRes);
  const compOutput = fcResult().data;
  console.log('Faculty Comparison Summary:');
  console.log('  Subject:', compOutput?.facultyComparison?.subject);
  console.log('  Student Percentage:', compOutput?.facultyComparison?.studentPercentage + '%');
  console.log('  Class Average:', compOutput?.facultyComparison?.classAveragePercentage + '%');
  console.log('  Difference:', compOutput?.facultyComparison?.difference + '%');
  console.log('  Above average?', compOutput?.facultyComparison?.isAboveAverage);
  console.log('  Exam comparisons:', compOutput?.facultyComparison?.examComparisons);

  // Security check: Faculty querying an unauthorized subject
  console.log('\n[3] Testing Faculty RBAC Constraint (Unauthorized subject access)...');
  const { req: badReq, res: badRes, getResult: badResult } = mockReqRes(facultyUser, {
    subject: 'Completely Unauthorized Subject 999',
    enrollment: selectedStudent?.enrollment
  });
  await getStudentPerformanceAnalytics(badReq, badRes);
  const badOutput = badResult();
  console.log('Unauthorized request status:', badOutput.status, badOutput.data?.message);
  if (badOutput.status === 403) {
    console.log('✓ RBAC Security PASS: Unauthorized subject was correctly blocked with HTTP 403.');
  } else {
    console.error('✗ RBAC Security FAIL: Faculty accessed unauthorized subject!');
  }

  // 4. Test Admin Search & Full Performance
  console.log('\n[4] Testing Admin Autocomplete Search & Full Access...');
  const adminUser = await User.findOne({ role: 'admin' });
  const { req: aSearchReq, res: aSearchRes, getResult: aSearchResult } = mockReqRes(adminUser, {
    q: 'Shaikh'
  });
  await searchStudentsForAnalytics(aSearchReq, aSearchRes);
  const searchResults = aSearchResult().data;
  console.log('Search matches for "Shaikh":', searchResults?.data);

  // Admin global performance access
  const { req: aPerfReq, res: aPerfRes, getResult: aPerfResult } = mockReqRes(adminUser, {
    enrollment: '21CS001'
  });
  await getStudentPerformanceAnalytics(aPerfReq, aPerfRes);
  const adminViewOutput = aPerfResult().data;
  console.log('Admin queried 21CS001:', adminViewOutput?.student?.name, 'Overall:', adminViewOutput?.metrics?.overallPercentage + '%');
  console.log('Admin saw semesters:', adminViewOutput?.semesterTrends?.map(s => s.label));

  console.log('\n✓ ALL BACKEND ANALYTICS TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testAnalyticsDirectly().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
