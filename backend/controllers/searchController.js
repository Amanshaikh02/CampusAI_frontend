const User = require('../models/User');
const FacultySubjectAssignment = require('../models/FacultySubjectAssignment');
const { getSemesterQueryFilter, normalizeSemester } = require('../utils/academicHelper');

/**
 * Escapes special characters for safe RegExp construction
 * @param {string} str 
 * @returns {string}
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @desc    Advanced unified search for Students and Faculty with dynamic filters
 * @route   GET /api/search
 * @access  Public / Protected (Optional token)
 * @query   role: 'student' | 'faculty'
 *          q: global search term (matches across multiple fields)
 *          name: partial match for Name
 *          enrollment: partial match for Student Enrollment No.
 *          sem: semester (exact/normalized e.g. 5, "Semester 5")
 *          div: division/section (exact/case-insensitive e.g. "A", "Section A")
 *          dept: department (e.g. "AIML", "Cyber Security")
 *          subject: partial match for faculty subjects taught
 */
exports.searchUsers = async (req, res) => {
  try {
    const rawRole = (req.query.role || 'student').trim().toLowerCase();
    const isFaculty = rawRole === 'faculty' || rawRole === 'teacher';
    const isStudent = !isFaculty; // default scope

    // Global search term
    const rawQ = (req.query.q || req.query.query || req.query.search || '').trim();

    // Specific filter fields
    const rawName = (req.query.name || '').trim();
    const rawEnrollment = (req.query.enrollment || req.query.enrollmentNo || '').trim();
    const rawSem = (req.query.sem || req.query.semester || '').trim();
    const rawDiv = (req.query.div || req.query.division || req.query.classSection || req.query.section || '').trim();
    const rawDept = (req.query.dept || req.query.department || '').trim();
    const rawSubject = (req.query.subject || req.query.subjects || req.query.subjectTaught || '').trim();

    // ----------------------------------------------------
    // 1. STUDENT SEARCH
    // ----------------------------------------------------
    if (isStudent) {
      const query = { role: { $in: ['student', 'Student'] } };
      const andConditions = [];

      // Global query 'q' matches name, enrollment, email, or department
      if (rawQ) {
        const qRegex = new RegExp(escapeRegex(rawQ), 'i');
        andConditions.push({
          $or: [
            { name: { $regex: qRegex } },
            { enrollment: { $regex: qRegex } },
            { email: { $regex: qRegex } },
            { department: { $regex: qRegex } },
            { course: { $regex: qRegex } }
          ]
        });
      }

      // Name partial match
      if (rawName) {
        andConditions.push({
          name: { $regex: new RegExp(escapeRegex(rawName), 'i') }
        });
      }

      // Enrollment partial match
      if (rawEnrollment) {
        andConditions.push({
          enrollment: { $regex: new RegExp(escapeRegex(rawEnrollment), 'i') }
        });
      }

      // Semester exact / normalized match
      if (rawSem && rawSem !== 'All' && rawSem !== 'all') {
        const semFilter = getSemesterQueryFilter(rawSem);
        if (Object.keys(semFilter).length > 0) {
          andConditions.push({ semester: semFilter });
        }
      }

      // Division / Class Section match
      if (rawDiv && rawDiv !== 'All' && rawDiv !== 'all') {
        const cleanDiv = rawDiv.replace(/^Section\s+/i, '').trim();
        const divRegex = new RegExp(`(^|\\b|Section\\s*)${escapeRegex(cleanDiv)}$`, 'i');
        const divOrConditions = [
          { classSection: { $regex: divRegex } },
          { section: { $regex: divRegex } }
        ];

        // If filtering for "General", also include records with empty, missing, or default sections
        if (cleanDiv.toLowerCase() === 'general') {
          divOrConditions.push(
            { classSection: '' },
            { classSection: null },
            { classSection: { $exists: false } },
            { section: '' },
            { section: null },
            { section: { $exists: false } }
          );
        }

        andConditions.push({
          $or: divOrConditions
        });
      }

      // Department filter
      if (rawDept && rawDept !== 'All' && rawDept !== 'all' && rawDept !== 'All Departments') {
        const deptRegex = new RegExp(`^${escapeRegex(rawDept)}$`, 'i');
        andConditions.push({
          $or: [
            { department: { $regex: deptRegex } },
            { course: { $regex: deptRegex } }
          ]
        });
      }

      if (andConditions.length > 0) {
        query.$and = andConditions;
      }

      const students = await User.find(query)
        .sort({ enrollment: 1, name: 1 })
        .limit(100)
        .lean();

      const safeResults = students.map((s) => ({
        id: s._id.toString(),
        _id: s._id.toString(),
        name: s.name || '',
        enrollment: s.enrollment || '',
        email: s.email || '',
        department: s.department || s.course || '',
        course: s.course || s.department || '',
        semester: s.semester || '',
        classSection: s.classSection || s.section || 'General',
        section: s.section || s.classSection || 'General',
        role: 'student',
        createdAt: s.createdAt
      }));

      return res.status(200).json({
        success: true,
        count: safeResults.length,
        role: 'student',
        filters: {
          q: rawQ,
          name: rawName,
          enrollment: rawEnrollment,
          sem: rawSem,
          div: rawDiv,
          dept: rawDept
        },
        data: safeResults
      });
    }

    // ----------------------------------------------------
    // 2. FACULTY SEARCH
    // ----------------------------------------------------
    const query = { role: { $in: ['faculty', 'teacher', 'Faculty', 'Teacher'] } };
    const andConditions = [];

    // Global query 'q' matches name, username, email, assigned subject, or department
    if (rawQ) {
      const qRegex = new RegExp(escapeRegex(rawQ), 'i');
      andConditions.push({
        $or: [
          { name: { $regex: qRegex } },
          { username: { $regex: qRegex } },
          { email: { $regex: qRegex } },
          { assignedSubject: { $regex: qRegex } },
          { department: { $regex: qRegex } }
        ]
      });
    }

    // Name or Username partial match
    if (rawName) {
      const nameRegex = new RegExp(escapeRegex(rawName), 'i');
      andConditions.push({
        $or: [
          { name: { $regex: nameRegex } },
          { username: { $regex: nameRegex } }
        ]
      });
    }

    // Department match
    if (rawDept && rawDept !== 'All' && rawDept !== 'all' && rawDept !== 'All Departments') {
      const deptRegex = new RegExp(`^${escapeRegex(rawDept)}$`, 'i');
      andConditions.push({ department: { $regex: deptRegex } });
    }

    // Semester filter for faculty: check User.semester OR assignments in FacultySubjectAssignment
    let facultyIdsWithSem = null;
    if (rawSem && rawSem !== 'All' && rawSem !== 'all') {
      const normSem = normalizeSemester(rawSem);
      if (normSem) {
        // Find faculty IDs teaching this semester from assignments
        const assignmentsWithSem = await FacultySubjectAssignment.find({
          semester: normSem
        }).distinct('facultyId');

        facultyIdsWithSem = assignmentsWithSem.map(id => id.toString());

        // Either User record has this semester, OR their assignment does
        const semFilter = getSemesterQueryFilter(rawSem);
        andConditions.push({
          $or: [
            { semester: semFilter },
            { _id: { $in: assignmentsWithSem } }
          ]
        });
      }
    }

    // Subject / Subjects Taught filter
    if (rawSubject) {
      const subjRegex = new RegExp(escapeRegex(rawSubject), 'i');
      // Find faculty IDs assigned to matching subjects
      const assignmentsWithSubj = await FacultySubjectAssignment.find({
        subject: { $regex: subjRegex }
      }).distinct('facultyId');

      andConditions.push({
        $or: [
          { assignedSubject: { $regex: subjRegex } },
          { _id: { $in: assignmentsWithSubj } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const facultyList = await User.find(query)
      .sort({ name: 1 })
      .limit(100)
      .lean();

    // Fetch all active assignments for these faculty members to include rich subjectsTaught details
    const facultyIds = facultyList.map((f) => f._id);
    const assignments = await FacultySubjectAssignment.find({
      facultyId: { $in: facultyIds },
      status: 'Active'
    }).lean();

    // Map assignments by facultyId
    const assignmentsByFaculty = {};
    assignments.forEach((asg) => {
      const fid = asg.facultyId.toString();
      if (!assignmentsByFaculty[fid]) {
        assignmentsByFaculty[fid] = [];
      }
      assignmentsByFaculty[fid].push(asg);
    });

    const safeResults = facultyList.map((f) => {
      const fid = f._id.toString();
      const userAssignments = assignmentsByFaculty[fid] || [];
      const distinctSubjects = Array.from(
        new Set([
          f.assignedSubject,
          ...userAssignments.map((a) => a.subject)
        ].filter(Boolean))
      );

      return {
        id: fid,
        _id: fid,
        name: f.name || '',
        username: f.username || '',
        email: f.email || '',
        department: f.department || '',
        assignedSubject: f.assignedSubject || (distinctSubjects[0] || ''),
        subjectsTaught: distinctSubjects,
        semester: f.semester || (userAssignments[0]?.semester ? `Semester ${userAssignments[0].semester}` : ''),
        classSection: f.classSection || f.section || (userAssignments[0]?.classSection || 'General'),
        role: 'faculty',
        assignmentsCount: userAssignments.length,
        createdAt: f.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      count: safeResults.length,
      role: 'faculty',
      filters: {
        q: rawQ,
        name: rawName,
        sem: rawSem,
        dept: rawDept,
        subject: rawSubject
      },
      data: safeResults
    });
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during search query.'
    });
  }
};

/**
 * @desc    Aggregate student counts grouped by Department -> Semester -> Division
 * @route   GET /api/search/student-insights
 * @access  Public / Protected (Optional token)
 */
exports.getStudentInsights = async (req, res) => {
  try {
    const pipeline = [
      { $match: { role: { $in: ['student', 'Student'] } } },
      {
        $project: {
          department: {
            $let: {
              vars: {
                rawDept: { $ifNull: ['$department', { $ifNull: ['$course', 'General'] }] }
              },
              in: {
                $cond: [
                  { $or: [{ $eq: ['$$rawDept', ''] }, { $eq: ['$$rawDept', null] }] },
                  'General',
                  '$$rawDept'
                ]
              }
            }
          },
          semester: {
            $let: {
              vars: {
                rawSem: { $ifNull: ['$semester', 'Semester 1'] }
              },
              in: {
                $cond: [
                  { $or: [{ $eq: ['$$rawSem', ''] }, { $eq: ['$$rawSem', null] }] },
                  'Semester 1',
                  '$$rawSem'
                ]
              }
            }
          },
          division: {
            $let: {
              vars: {
                rawDiv: { $ifNull: ['$classSection', { $ifNull: ['$section', 'General'] }] }
              },
              in: {
                $cond: [
                  { $or: [{ $eq: ['$$rawDiv', ''] }, { $eq: ['$$rawDiv', null] }] },
                  'General',
                  '$$rawDiv'
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            department: '$department',
            semester: '$semester',
            division: '$division'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.department': 1,
          '_id.semester': 1,
          '_id.division': 1
        }
      }
    ];

    const aggregated = await User.aggregate(pipeline);

    let totalStudents = 0;
    const tree = {};
    const departmentMap = {};
    const semesterMap = {};
    const divisionMap = {};

    const groups = aggregated.map(item => {
      const dept = item._id.department || 'General';
      const sem = item._id.semester || 'Semester 1';
      const div = item._id.division || 'General';
      const count = item.count;

      totalStudents += count;

      departmentMap[dept] = (departmentMap[dept] || 0) + count;
      semesterMap[sem] = (semesterMap[sem] || 0) + count;
      divisionMap[div] = (divisionMap[div] || 0) + count;

      if (!tree[dept]) {
        tree[dept] = { total: 0, semesters: {} };
      }
      tree[dept].total += count;

      if (!tree[dept].semesters[sem]) {
        tree[dept].semesters[sem] = { total: 0, divisions: {} };
      }
      tree[dept].semesters[sem].total += count;
      tree[dept].semesters[sem].divisions[div] = (tree[dept].semesters[sem].divisions[div] || 0) + count;

      return {
        department: dept,
        semester: sem,
        division: div,
        count
      };
    });

    const summary = {
      totalStudents,
      departments: Object.entries(departmentMap).map(([name, count]) => ({ name, count })),
      semesters: Object.entries(semesterMap).map(([name, count]) => ({ name, count })),
      divisions: Object.entries(divisionMap).map(([name, count]) => ({ name, count }))
    };

    return res.status(200).json({
      success: true,
      totalStudents,
      groups,
      tree,
      summary
    });
  } catch (error) {
    console.error('Error in getStudentInsights:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred while aggregating student insights.'
    });
  }
};

