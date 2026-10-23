const { TimetableEntry, SentTimetable } = require('../models/Timetable');

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

/**
 * Sorts timetable slots chronologically by Day of Week then Start Time
 */
const sortEntries = (a, b) => {
  const dayA = DAY_ORDER[a.day || a.dayOfWeek] || 99;
  const dayB = DAY_ORDER[b.day || b.dayOfWeek] || 99;
  if (dayA !== dayB) return dayA - dayB;
  return (a.startTime || '').localeCompare(b.startTime || '');
};

// @desc    Get timetable entries with optional dynamic filters
// @route   GET /api/timetable/entries
// @access  Protected (Admin / Faculty / Teacher)
exports.getEntries = async (req, res) => {
  try {
    const { department, semester, division, day } = req.query;
    const query = {};

    if (department && department !== 'All' && department !== 'All Departments') {
      query.department = { $in: [department, 'All Departments'] };
    }

    if (semester && semester !== 'All') {
      query.semester = semester;
    }

    if (division && division !== 'All') {
      query.division = { $regex: new RegExp(`^${division}$`, 'i') };
    }

    if (day && day !== 'All') {
      query.$or = [{ day }, { dayOfWeek: day }];
    }

    const entries = await TimetableEntry.find(query).lean();
    entries.sort(sortEntries);

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching timetable entries.'
    });
  }
};

// @desc    Create a new dynamic timetable slot
// @route   POST /api/timetable/entries
// @access  Protected (Admin)
exports.createEntry = async (req, res) => {
  try {
    const {
      department,
      semester,
      division,
      day,
      dayOfWeek,
      startTime,
      endTime,
      subject,
      faculty,
      facultyId,
      roomNumber,
      sessionType,
      isBreak,
      date
    } = req.body;

    const resolvedDay = day || dayOfWeek;
    const isBreakSlot = Boolean(isBreak);

    if (!department || !resolvedDay || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Department, Day, Start Time, and End Time are strictly required.'
      });
    }

    if (!isBreakSlot && (!subject || subject.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required for regular teaching slots.'
      });
    }

    const newEntry = await TimetableEntry.create({
      department: department.trim(),
      semester: (semester || 'Semester 1').trim(),
      division: (division || 'A').trim(),
      day: resolvedDay.trim(),
      dayOfWeek: resolvedDay.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      subject: isBreakSlot ? (subject?.trim() || 'Break') : (subject?.trim() || ''),
      faculty: isBreakSlot ? '' : (faculty?.trim() || ''),
      facultyId: facultyId || null,
      roomNumber: isBreakSlot ? '' : (roomNumber?.trim() || ''),
      sessionType: isBreakSlot ? 'Break' : (sessionType || 'Theory'),
      isBreak: isBreakSlot,
      date: date || new Date().toISOString().split('T')[0]
    });

    res.status(201).json({
      success: true,
      message: isBreakSlot ? 'Break slot added successfully.' : 'Timetable slot created successfully.',
      data: newEntry
    });
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating timetable entry.'
    });
  }
};

// @desc    Update an existing timetable slot
// @route   PUT /api/timetable/entries/:id
// @access  Protected (Admin)
exports.updateEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable slot not found.'
      });
    }

    const {
      department,
      semester,
      division,
      day,
      dayOfWeek,
      startTime,
      endTime,
      subject,
      faculty,
      facultyId,
      roomNumber,
      sessionType,
      isBreak,
      date
    } = req.body;

    const resolvedDay = day || dayOfWeek || entry.day;
    const isBreakSlot = isBreak !== undefined ? Boolean(isBreak) : entry.isBreak;

    entry.department = department ? department.trim() : entry.department;
    entry.semester = semester ? semester.trim() : entry.semester;
    entry.division = division ? division.trim() : entry.division;
    entry.day = resolvedDay;
    entry.dayOfWeek = resolvedDay;
    entry.startTime = startTime ? startTime.trim() : entry.startTime;
    entry.endTime = endTime ? endTime.trim() : entry.endTime;
    entry.isBreak = isBreakSlot;
    entry.sessionType = isBreakSlot ? 'Break' : (sessionType || entry.sessionType || 'Theory');
    entry.subject = isBreakSlot ? (subject?.trim() || 'Break') : (subject?.trim() || entry.subject);
    entry.faculty = isBreakSlot ? '' : (faculty !== undefined ? faculty.trim() : entry.faculty);
    entry.facultyId = isBreakSlot ? null : (facultyId !== undefined ? facultyId : entry.facultyId);
    entry.roomNumber = isBreakSlot ? '' : (roomNumber !== undefined ? roomNumber.trim() : entry.roomNumber);
    if (date) entry.date = date;

    await entry.save();

    res.status(200).json({
      success: true,
      message: 'Timetable slot updated successfully.',
      data: entry
    });
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating timetable entry.'
    });
  }
};

// @desc    Delete a timetable slot
// @route   DELETE /api/timetable/entries/:id
// @access  Protected (Admin)
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable slot not found.'
      });
    }

    await TimetableEntry.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting timetable entry.'
    });
  }
};

// @desc    Send / Publish complete timetable
// @route   POST /api/timetable/send
// @access  Protected (Admin)
exports.sendTimetable = async (req, res) => {
  try {
    const { department, semester, division, audience } = req.body;

    if (!department || !audience) {
      return res.status(400).json({
        success: false,
        message: 'Department and Audience are required.'
      });
    }

    // Filter matching timetable entries
    let query = {};
    if (department !== 'All Departments') {
      query.department = { $in: [department, 'All Departments'] };
    }
    if (semester && semester !== 'All') {
      query.semester = semester;
    }
    if (division && division !== 'All') {
      query.division = division;
    }

    const matchingEntries = await TimetableEntry.find(query).lean();
    matchingEntries.sort(sortEntries);

    const sentDoc = await SentTimetable.create({
      department,
      semester: semester || 'All',
      division: division || 'All',
      audience,
      entries: matchingEntries.map((e) => ({
        date: e.date,
        day: e.day,
        dayOfWeek: e.dayOfWeek || e.day,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject,
        department: e.department,
        semester: e.semester,
        division: e.division,
        faculty: e.faculty,
        roomNumber: e.roomNumber,
        sessionType: e.sessionType,
        isBreak: e.isBreak
      })),
      sentAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: `Complete timetable sent successfully to ${department} ${audience}.`,
      data: sentDoc
    });
  } catch (error) {
    console.error('Error sending timetable:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error sending timetable.'
    });
  }
};

// @desc    Get timetable for specific student or faculty (dynamic + published fallback)
// @route   GET /api/timetable/my-timetable
// @access  Protected
exports.getMyTimetable = async (req, res) => {
  try {
    const { department, semester, division, role, facultyName, username } = req.query;

    if (!department) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const isTeacher = role === 'teacher' || role === 'faculty';

    // 1. Direct query from active TimetableEntry slots
    let liveQuery = {};
    if (department !== 'All Departments') {
      liveQuery.department = { $in: [department, 'All Departments'] };
    }

    if (!isTeacher) {
      // Student query: match semester & division if available
      if (semester && semester !== 'All') {
        liveQuery.semester = semester;
      }
      if (division && division !== 'All') {
        liveQuery.division = { $regex: new RegExp(`^${division}$`, 'i') };
      }
    } else {
      // Faculty query: optionally filter slots taught by faculty or whole department
      const fIdentifier = facultyName || username;
      if (fIdentifier) {
        liveQuery.$or = [
          { faculty: { $regex: new RegExp(fIdentifier, 'i') } },
          { department: { $in: [department, 'All Departments'] } }
        ];
      }
    }

    const liveEntries = await TimetableEntry.find(liveQuery).lean();

    if (liveEntries && liveEntries.length > 0) {
      liveEntries.sort(sortEntries);
      return res.status(200).json({
        success: true,
        source: 'live',
        count: liveEntries.length,
        data: liveEntries
      });
    }

    // 2. Fallback to latest published SentTimetable
    const audienceFilter = isTeacher
      ? ['Faculty', 'Students & Faculty']
      : ['Students', 'Students & Faculty'];

    const sentQuery = {
      department: { $in: [department, 'All Departments'] },
      audience: { $in: audienceFilter }
    };
    if (semester && semester !== 'All') {
      sentQuery.$or = [{ semester }, { semester: 'All' }];
    }

    const latestSent = await SentTimetable.findOne(sentQuery).sort({ sentAt: -1 }).lean();

    const fallbackEntries = latestSent ? (latestSent.entries || []) : [];
    fallbackEntries.sort(sortEntries);

    res.status(200).json({
      success: true,
      source: 'published',
      count: fallbackEntries.length,
      data: fallbackEntries,
      meta: latestSent || null
    });
  } catch (error) {
    console.error('Error fetching student/faculty timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching timetable.'
    });
  }
};

// @desc    Get all sent timetable history
// @route   GET /api/timetable/sent-history
// @access  Protected
exports.getAllSentTimetables = async (req, res) => {
  try {
    const history = await SentTimetable.find().sort({ sentAt: -1 }).lean();
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching sent timetable history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sent timetable history.'
    });
  }
};
