const Announcement = require('../models/Announcement');

// Allowed options
const VALID_DEPARTMENTS = ['AIML', 'Cyber Security', 'All Departments'];
const VALID_TARGET_ROLES = ['Students', 'Faculty', 'Students & Faculty'];

// @desc    Get all announcements filtered by user role and department
// @route   GET /api/announcements
// @access  Private (Authenticated: Student, Faculty, Admin)
exports.getAnnouncements = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    const userDept = (req.user?.department || req.user?.course || '').trim();

    let query = {};

    if (userRole === 'admin') {
      // Admin sees ALL announcements across all departments and target roles
      const { department, targetRole } = req.query;
      if (department && department !== 'All Departments') {
        query.department = { $in: [department, 'All Departments'] };
      }
      if (targetRole) {
        query.targetRole = targetRole;
      }
    } else if (userRole === 'student') {
      // Student: Only see announcements where:
      // 1. Department is either 'All Departments' or their specific department
      // 2. targetRole is either 'Students' or 'Students & Faculty'
      // 3. Or individually targeted to this student's enrollment
      const deptMatches = ['All Departments'];
      if (userDept) {
        deptMatches.push(userDept);
      }
      const studentEnrollment = (req.user?.enrollment || '').trim();

      const generalCriteria = {
        department: { $in: deptMatches },
        targetRole: { $in: ['Students', 'Students & Faculty'] },
        targetType: { $ne: 'individual' },
        targetStudentEnrollment: { $in: ['', null] }
      };

      if (studentEnrollment) {
        query = {
          $or: [
            { targetStudentEnrollment: studentEnrollment },
            generalCriteria
          ]
        };
      } else {
        query = generalCriteria;
      }
    } else if (userRole === 'teacher' || userRole === 'faculty') {
      // Faculty: Only see announcements where:
      // 1. Department is either 'All Departments' or their specific department
      // 2. targetRole is either 'Faculty' or 'Students & Faculty'
      const deptMatches = ['All Departments'];
      if (userDept) {
        deptMatches.push(userDept);
      }

      query = {
        department: { $in: deptMatches },
        targetRole: { $in: ['Faculty', 'Students & Faculty'] }
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: unrecognized user role.'
      });
    }

    // Ensure any legacy announcement has a valid future expiration date
    await Announcement.updateMany(
      { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }] },
      { $set: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
    );

    // Proactively purge expired announcements from database
    await Announcement.deleteMany({ expiresAt: { $lte: new Date() } });

    // CRITICAL FIX: Strictly filter out expired items using { expiresAt: { $gt: new Date() } }
    const finalQuery = Object.keys(query).length > 0
      ? { $and: [query, { expiresAt: { $gt: new Date() } }] }
      : { expiresAt: { $gt: new Date() } };

    const announcements = await Announcement.find(finalQuery).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcements.'
    });
  }
};

// @desc    Create a new announcement with department and role targeting
// @route   POST /api/announcements
// @access  Private (Admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can publish announcements.'
      });
    }

    const {
      title,
      message,
      description,
      department,
      targetRole,
      targetType,
      targetStudentEnrollment,
      date,
      time,
      fileName,
      fileType,
      fileSize,
      fileData,
      expiresAt
    } = req.body;

    const resolvedMessage = (message || description || '').trim();

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement title is required.'
      });
    }

    if (!resolvedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Announcement message / description is required.'
      });
    }

    if (!department || !VALID_DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        success: false,
        message: `Department must be one of: ${VALID_DEPARTMENTS.join(', ')}`
      });
    }

    if (!targetRole || !VALID_TARGET_ROLES.includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: `Target role must be one of: ${VALID_TARGET_ROLES.join(', ')}`
      });
    }

    // Resolve expiration timestamp
    let resolvedExpiresAt = null;
    if (expiresAt) {
      resolvedExpiresAt = new Date(expiresAt);
    } else {
      // Default to 7 days ahead
      resolvedExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: resolvedMessage,
      department,
      targetRole,
      targetType: targetType || (targetStudentEnrollment ? 'individual' : 'department'),
      targetStudentEnrollment: (targetStudentEnrollment || '').trim(),
      createdBy: req.user?.name || req.user?.username || 'Admin',
      date: date || new Date().toLocaleDateString('en-IN'),
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileName: fileName || '',
      fileType: fileType || '',
      fileSize: fileSize || '',
      fileData: fileData || '',
      expiresAt: resolvedExpiresAt
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating announcement.'
    });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete announcements.'
      });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting announcement.'
    });
  }
};
