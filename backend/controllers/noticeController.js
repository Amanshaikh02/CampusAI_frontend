const Notice = require('../models/Notice');

// @desc    Get all notices (with audience / department / individual filtering)
// @route   GET /api/notices
// @access  Private (Authenticated)
exports.getNotices = async (req, res) => {
  try {
    const { department, audience } = req.query;
    const userRole = (req.user?.role || '').toLowerCase();
    const userDept = req.user?.department || req.user?.course || '';
    const userEnrollment = req.user?.enrollment || '';

    let query = {};

    if (userRole === 'admin') {
      if (department && department !== 'All Departments') {
        query.targetDepartment = { $in: [department, 'All Departments'] };
      }
      if (audience) {
        query.audience = audience;
      }
    } else if (userRole === 'student') {
      const deptMatches = ['All Departments'];
      if (userDept) deptMatches.push(userDept);

      query.$or = [
        // A. Individual notice specifically for this student
        {
          $or: [
            { targetStudentEnrollment: userEnrollment },
            { student: userEnrollment }
          ]
        },
        // B. Department or Public notice (student-inclusive audience, NOT targeted to another student)
        {
          $and: [
            { targetDepartment: { $in: deptMatches } },
            {
              $or: [
                { targetType: { $ne: 'individual' } },
                { targetType: { $exists: false } }
              ]
            },
            {
              $or: [
                { targetStudentEnrollment: '' },
                { targetStudentEnrollment: null },
                { targetStudentEnrollment: { $exists: false } }
              ]
            },
            {
              $or: [
                { student: '' },
                { student: null },
                { student: { $exists: false } }
              ]
            },
            {
              $or: [
                { audience: { $in: ['Students', 'Students & Faculty', 'All Students', 'Everyone', 'All', '', null] } },
                { audience: { $exists: false } }
              ]
            }
          ]
        }
      ];
    } else if (userRole === 'faculty' || userRole === 'teacher') {
      const deptMatches = ['All Departments'];
      if (userDept) deptMatches.push(userDept);

      query.$or = [
        {
          $and: [
            { targetDepartment: { $in: deptMatches } },
            {
              $or: [
                { audience: { $in: ['Faculty', 'Students & Faculty', 'All Faculty', 'Everyone', 'All', '', null] } },
                { audience: { $exists: false } }
              ]
            }
          ]
        },
        { postedBy: req.user?.name || 'Faculty' }
      ];
    }

    // Ensure any legacy notice has a valid future expiration date
    await Notice.updateMany(
      { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }] },
      { $set: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
    );

    // Proactively purge expired notices from database
    await Notice.deleteMany({ expiresAt: { $lte: new Date() } });

    // CRITICAL FIX: Strictly filter out expired items using { expiresAt: { $gt: new Date() } }
    const finalQuery = Object.keys(query).length > 0
      ? { $and: [query, { expiresAt: { $gt: new Date() } }] }
      : { expiresAt: { $gt: new Date() } };

    // Total notices count for pagination metadata
    const totalRecords = await Notice.countDocuments(finalQuery);

    // Pagination: page and limit
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit !== undefined
      ? Math.max(0, parseInt(req.query.limit, 10))
      : (req.query.page ? 10 : 0);

    let noticesQuery = Notice.find(finalQuery).sort({ createdAt: -1 });
    if (limit > 0) {
      const skip = (page - 1) * limit;
      noticesQuery = noticesQuery.skip(skip).limit(limit);
    }

    const notices = await noticesQuery;
    const totalPages = limit > 0 ? Math.ceil(totalRecords / limit) : 1;

    res.status(200).json({
      success: true,
      count: notices.length,
      totalRecords,
      currentPage: page,
      totalPages,
      limit: limit || totalRecords,
      data: notices
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notices.'
    });
  }
};

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (Admin/Teacher)
exports.createNotice = async (req, res) => {
  try {
    const {
      title,
      category,
      audience,
      targetType,
      targetDepartment,
      targetStudentEnrollment,
      student,
      content,
      postedBy,
      expiresAt
    } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and content are required.'
      });
    }

    const resolvedEnrollment = (targetStudentEnrollment || student || '').trim();
    let resolvedTargetType = targetType || 'all';
    if (resolvedEnrollment) {
      resolvedTargetType = 'individual';
    } else if (targetDepartment && targetDepartment !== 'All Departments') {
      resolvedTargetType = 'department';
    }

    // Resolve expiration timestamp
    let resolvedExpiresAt = null;
    if (expiresAt) {
      resolvedExpiresAt = new Date(expiresAt);
    } else {
      resolvedExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const notice = await Notice.create({
      title: title.trim(),
      category: category.trim(),
      audience: audience || 'Everyone',
      targetType: resolvedTargetType,
      targetDepartment: targetDepartment || 'All Departments',
      targetStudentEnrollment: resolvedEnrollment,
      student: resolvedEnrollment,
      content: content.trim(),
      postedBy: postedBy || req.user?.name || 'Admin',
      expiresAt: resolvedExpiresAt
    });

    res.status(201).json({
      success: true,
      message: 'Notice created successfully.',
      data: notice
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating notice.'
    });
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found.'
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting notice.'
    });
  }
};
