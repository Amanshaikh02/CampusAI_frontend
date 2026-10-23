const mongoose = require('mongoose');

// Register all project models
const models = [
  require('../models/User'),
  require('../models/Session'),
  require('../models/Announcement'),
  require('../models/Notice'),
  require('../models/Event'),
  require('../models/Material'),
  require('../models/Attendance'),
  require('../models/AttendanceSession'),
  require('../models/FacultySubjectAssignment'),
  require('../models/Mark'),
  require('../models/Assignment'),
  require('../models/Submission'),
  require('../models/Course'),
  require('../models/Subject'),
  require('../models/Class'),
  require('../models/Message'),
  require('../models/Conversation'),
  require('../models/Timetable').TimetableEntry,
  require('../models/Timetable').SentTimetable
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected: ' + conn.connection.host);

    // Verify and ensure all physical collections exist in MongoDB Atlas
    for (const model of models) {
      try {
        await model.createCollection();
      } catch (err) {
        // Collection already exists on Atlas, proceed
      }
    }
    console.log(`Verified ${models.length} collections in MongoDB Atlas.`);
  } catch (error) {
    console.error('Error connecting to MongoDB: ' + error.message);
  }
};

module.exports = connectDB;