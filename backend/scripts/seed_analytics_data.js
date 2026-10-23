const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Mark = require('../models/Mark');
const Attendance = require('../models/Attendance');
const FacultySubjectAssignment = require('../models/FacultySubjectAssignment');

async function seedAnalyticsData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // 1. Ensure students exist with proper enrollment numbers
    const studentsToEnsure = [
      {
        name: 'Shaikh Aman Irfanbhai',
        enrollment: '23018501210234',
        department: 'AIML',
        semester: 'Semester 7',
        classSection: 'A',
        role: 'student'
      },
      {
        name: 'hitarth',
        enrollment: '23018501210236',
        department: 'Cyber Security',
        semester: 'Semester 8',
        classSection: 'A',
        role: 'student'
      },
      {
        name: 'Aarav Patel',
        enrollment: '21AIML001',
        department: 'AIML',
        semester: 'Semester 7',
        classSection: 'A',
        role: 'student'
      },
      {
        name: 'Priya Sharma',
        enrollment: '21AIML002',
        department: 'AIML',
        semester: 'Semester 7',
        classSection: 'A',
        role: 'student'
      },
      {
        name: 'Rohan Mehra',
        enrollment: '21CS001',
        department: 'Cyber Security',
        semester: 'Semester 7',
        classSection: 'B',
        role: 'student'
      },
      {
        name: 'Ananya Desai',
        enrollment: '21CS002',
        department: 'Cyber Security',
        semester: 'Semester 7',
        classSection: 'B',
        role: 'student'
      }
    ];

    for (const s of studentsToEnsure) {
      await User.findOneAndUpdate(
        { enrollment: s.enrollment },
        { $set: s },
        { upsert: true, new: true }
      );
    }
    console.log('✓ Students verified / updated.');

    // 2. Sample marks across Semesters 4, 5, 6, 7
    const curriculum = {
      AIML: {
        'Semester 4': [
          { subject: 'Data Structures & Algorithms', max: 50 },
          { subject: 'Discrete Mathematics', max: 50 },
          { subject: 'Computer Organization', max: 50 },
          { subject: 'Database Management Systems', max: 50 }
        ],
        'Semester 5': [
          { subject: 'Artificial Intelligence Foundations', max: 50 },
          { subject: 'Operating Systems', max: 50 },
          { subject: 'Design & Analysis of Algorithms', max: 50 },
          { subject: 'Computer Networks', max: 50 }
        ],
        'Semester 6': [
          { subject: 'Machine Learning', max: 50 },
          { subject: 'Theory of Computation', max: 50 },
          { subject: 'Cloud Computing & DevOps', max: 50 },
          { subject: 'Software Engineering', max: 50 }
        ],
        'Semester 7': [
          { subject: 'Deep Learning', max: 50 },
          { subject: 'Natural Language Processing', max: 50 },
          { subject: 'Computer Vision', max: 50 },
          { subject: 'MERN', max: 50 },
          { subject: 'Machine Learning', max: 50 }
        ]
      },
      'Cyber Security': {
        'Semester 5': [
          { subject: 'Network Security Fundamentals', max: 50 },
          { subject: 'Applied Cryptography', max: 50 },
          { subject: 'Operating System Security', max: 50 }
        ],
        'Semester 6': [
          { subject: 'Ethical Hacking & Penetration Testing', max: 50 },
          { subject: 'Web Application Security', max: 50 },
          { subject: 'Malware Analysis', max: 50 }
        ],
        'Semester 7': [
          { subject: 'Network Security', max: 50 },
          { subject: 'Cyber Forensics & Incident Response', max: 50 },
          { subject: 'Cloud Security Architecture', max: 50 },
          { subject: 'Cyber', max: 50 }
        ],
        'Semester 8': [
          { subject: 'Cyber Law & Compliance', max: 50 },
          { subject: 'CL AE', max: 50 },
          { subject: 'Advanced Threat Hunting', max: 50 }
        ]
      }
    };

    // Calculate marks with realistic variance
    const allStudents = await User.find({ role: 'student' });
    let createdCount = 0;

    for (const student of allStudents) {
      const dept = student.department === 'Cyber Security' ? 'Cyber Security' : 'AIML';
      const semMap = curriculum[dept] || curriculum['AIML'];

      // Assign student base capability
      const basePct = student.enrollment.includes('23018501210234')
        ? 0.86
        : student.enrollment.includes('21AIML001')
        ? 0.91
        : student.enrollment.includes('21CS001')
        ? 0.88
        : 0.78;

      for (const [semester, subjects] of Object.entries(semMap)) {
        // Semester progression factor (students improve slightly over semesters)
        const semNum = parseInt(semester.replace(/\D/g, ''), 10) || 5;
        const progressBonus = (semNum - 4) * 0.02;

        for (const sub of subjects) {
          // Midterm Exam (Max 30)
          const midMax = 30;
          const midObtained = Math.min(
            midMax,
            Math.max(16, Math.round(midMax * (basePct + progressBonus + (Math.random() * 0.14 - 0.07))))
          );
          const midPct = (midObtained / midMax) * 100;
          const midGrade = midPct >= 90 ? 'A+' : midPct >= 80 ? 'A' : midPct >= 70 ? 'B+' : midPct >= 60 ? 'B' : 'C';

          await Mark.findOneAndUpdate(
            {
              enrollment: student.enrollment,
              subject: sub.subject,
              exam: 'Mid Term',
              semester: semester
            },
            {
              $set: {
                student: student.name,
                enrollment: student.enrollment,
                subject: sub.subject,
                exam: 'Mid Term',
                score: `${midObtained}/${midMax}`,
                maxMarks: midMax,
                marksObtained: String(midObtained),
                attendanceStatus: 'Present',
                grade: midGrade,
                department: dept,
                semester: semester,
                division: student.classSection || 'A',
                academicYear: '2026-2027',
                enteredBy: 'Faculty Examination Board'
              }
            },
            { upsert: true }
          );
          createdCount++;

          // End Sem Exam (Max 50) for earlier semesters
          if (semNum < 7) {
            const endMax = 50;
            const endObtained = Math.min(
              endMax,
              Math.max(26, Math.round(endMax * (basePct + progressBonus + (Math.random() * 0.12 - 0.06))))
            );
            const endPct = (endObtained / endMax) * 100;
            const endGrade = endPct >= 90 ? 'A+' : endPct >= 80 ? 'A' : endPct >= 70 ? 'B+' : endPct >= 60 ? 'B' : 'C';

            await Mark.findOneAndUpdate(
              {
                enrollment: student.enrollment,
                subject: sub.subject,
                exam: 'End Sem Exam',
                semester: semester
              },
              {
                $set: {
                  student: student.name,
                  enrollment: student.enrollment,
                  subject: sub.subject,
                  exam: 'End Sem Exam',
                  score: `${endObtained}/${endMax}`,
                  maxMarks: endMax,
                  marksObtained: String(endObtained),
                  attendanceStatus: 'Present',
                  grade: endGrade,
                  department: dept,
                  semester: semester,
                  division: student.classSection || 'A',
                  academicYear: '2026-2027',
                  enteredBy: 'Controller of Examinations'
                }
              },
              { upsert: true }
            );
            createdCount++;
          }
        }
      }

      // Generate Attendance history (25 sessions per student)
      for (let i = 1; i <= 25; i++) {
        const day = i < 10 ? `0${i}` : `${i}`;
        const isAbsent = Math.random() < 0.12; // ~88% attendance
        await Attendance.findOneAndUpdate(
          {
            enrollment: student.enrollment,
            date: `2026-09-${day}`,
            subject: dept === 'AIML' ? 'Machine Learning' : 'Network Security'
          },
          {
            $set: {
              student: student.name,
              enrollment: student.enrollment,
              subject: dept === 'AIML' ? 'Machine Learning' : 'Network Security',
              department: dept,
              semester: 7,
              date: `2026-09-${day}`,
              status: isAbsent ? 'Absent' : 'Present',
              markedBy: 'Faculty Portal'
            }
          },
          { upsert: true }
        );
      }
    }

    console.log(`✓ Generated ${createdCount} comprehensive evaluation marks across semesters.`);
    console.log('✓ Seeded realistic attendance records.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedAnalyticsData();
