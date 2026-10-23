const Event = require('../models/Event');

// @desc    Get all events (with audience / department / individual filtering)
// @route   GET /api/events
// @access  Private (Authenticated)
exports.getEvents = async (req, res) => {
  try {
    const { department } = req.query;
    const userRole = (req.user?.role || '').toLowerCase();
    const userDept = req.user?.department || req.user?.course || '';
    const userEnrollment = req.user?.enrollment || '';

    let query = {};

    if (userRole === 'admin') {
      if (department && department !== 'All Departments') {
        query.targetDepartment = { $in: [department, 'All Departments'] };
      }
    } else if (userRole === 'student') {
      const deptMatches = ['All Departments'];
      if (userDept) deptMatches.push(userDept);

      query.$or = [
        // A. Individual event specifically for this student
        {
          $or: [
            { targetStudentEnrollment: userEnrollment },
            { student: userEnrollment }
          ]
        },
        // B. Department or Public event (student-inclusive audience, NOT targeted to another student)
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
        { organizer: req.user?.name || 'Administration' }
      ];
    }

    // Ensure any legacy event has a valid future expiration date
    await Event.updateMany(
      { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }] },
      { $set: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
    );

    // Proactively purge expired events from database
    await Event.deleteMany({ expiresAt: { $lte: new Date() } });

    // CRITICAL FIX: Strictly filter out expired items using { expiresAt: { $gt: new Date() } }
    const finalQuery = Object.keys(query).length > 0
      ? { $and: [query, { expiresAt: { $gt: new Date() } }] }
      : { expiresAt: { $gt: new Date() } };

    const events = await Event.find(finalQuery).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events.'
    });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin)
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      category,
      date,
      startTime,
      endTime,
      venue,
      description,
      organizer,
      targetType,
      targetDepartment,
      targetStudentEnrollment,
      student,
      audience,
      expiresAt
    } = req.body;

    if (!title || !category || !date || !startTime || !venue || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields (title, category, date, startTime, venue, description) must be provided.'
      });
    }

    const time = endTime ? `${startTime} - ${endTime}` : startTime;
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
      if (date) {
        const eventDateObj = new Date(date);
        if (!isNaN(eventDateObj.getTime())) {
          resolvedExpiresAt = new Date(eventDateObj.getTime() + 24 * 60 * 60 * 1000);
        }
      }
      if (!resolvedExpiresAt) {
        resolvedExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    const event = await Event.create({
      title: title.trim(),
      category: category.trim(),
      date,
      startTime,
      endTime: endTime || '',
      time,
      venue: venue.trim(),
      description: description.trim(),
      organizer: organizer || req.user?.name || 'Administration',
      targetType: resolvedTargetType,
      targetDepartment: targetDepartment || 'All Departments',
      targetStudentEnrollment: resolvedEnrollment,
      student: resolvedEnrollment,
      audience: audience || 'Everyone',
      expiresAt: resolvedExpiresAt
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating event.'
    });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting event.'
    });
  }
};
