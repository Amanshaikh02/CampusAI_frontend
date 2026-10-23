const mongoose = require('mongoose');

const TimetableEntrySchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      default: 'Semester 1',
      trim: true
    },
    division: {
      type: String,
      required: [true, 'Division is required'],
      default: 'A',
      trim: true
    },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      trim: true
    },
    dayOfWeek: {
      type: String,
      trim: true
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true
    },
    subject: {
      type: String,
      trim: true,
      default: ''
    },
    faculty: {
      type: String,
      trim: true,
      default: ''
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    roomNumber: {
      type: String,
      trim: true,
      default: ''
    },
    sessionType: {
      type: String,
      enum: ['Theory', 'Practical', 'Break'],
      default: 'Theory'
    },
    isBreak: {
      type: Boolean,
      default: false
    },
    // Maintained for backward compatibility
    date: {
      type: String,
      trim: true,
      default: () => new Date().toISOString().split('T')[0]
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware to synchronize dayOfWeek & break properties
TimetableEntrySchema.pre('save', function () {
  if (this.day && !this.dayOfWeek) {
    this.dayOfWeek = this.day;
  } else if (this.dayOfWeek && !this.day) {
    this.day = this.dayOfWeek;
  }

  if (this.isBreak) {
    this.sessionType = 'Break';
    if (!this.subject || this.subject.trim() === '') {
      this.subject = 'Break';
    }
    this.faculty = '';
  }
});

const SentTimetableSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      default: 'All'
    },
    division: {
      type: String,
      default: 'All'
    },
    audience: {
      type: String,
      required: true,
      enum: ['Students', 'Faculty', 'Students & Faculty']
    },
    entries: [
      {
        date: String,
        day: String,
        dayOfWeek: String,
        startTime: String,
        endTime: String,
        subject: String,
        department: String,
        semester: String,
        division: String,
        faculty: String,
        roomNumber: String,
        sessionType: String,
        isBreak: Boolean
      }
    ],
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const TimetableEntry = mongoose.model('TimetableEntry', TimetableEntrySchema);
const SentTimetable = mongoose.model('SentTimetable', SentTimetableSchema);

module.exports = { TimetableEntry, SentTimetable };
