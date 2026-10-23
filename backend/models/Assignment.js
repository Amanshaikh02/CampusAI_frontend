const mongoose = require('mongoose');

const QuestionItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true, trim: true },
    marks: { type: Number, default: 5 }
  },
  { _id: false }
);

const AssignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    facultyUsername: {
      type: String,
      trim: true,
      default: ''
    },
    class: {
      type: String,
      default: 'Regular',
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    instructions: {
      type: String,
      default: '',
      trim: true
    },
    questionsList: {
      type: [QuestionItemSchema],
      default: []
    },
    questions: {
      type: String,
      default: '',
      trim: true
    },
    totalMarks: {
      type: Number,
      default: 10
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required']
    },
    dueTime: {
      type: String,
      required: [true, 'Due time is required']
    },
    dueDateTime: {
      type: Date,
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Med', 'High'],
      default: 'Med'
    },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Closed', 'Archived'],
      default: 'Published'
    },
    department: {
      type: String,
      enum: ['AIML', 'Cyber Security', 'All Departments'],
      default: 'AIML',
      index: true
    },
    semester: {
      type: Number,
      default: 7,
      index: true
    },
    targetRole: {
      type: String,
      enum: ['Students', 'Faculty', 'Students & Faculty'],
      default: 'Students'
    },
    targetType: {
      type: String,
      enum: ['all', 'department', 'individual'],
      default: 'department'
    },
    targetDepartment: {
      type: String,
      default: 'AIML'
    },
    targetStudentEnrollment: {
      type: String,
      trim: true,
      default: ''
    },
    student: {
      type: String,
      trim: true,
      default: ''
    },
    audience: {
      type: String,
      default: 'Students'
    },
    fileName: {
      type: String,
      default: null
    },
    fileType: {
      type: String,
      default: null
    },
    fileSize: {
      type: String,
      default: null
    },
    fileData: {
      type: String,
      default: null
    },
    allowLate: {
      type: Boolean,
      default: false
    },
    notify: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      default: 'Faculty'
    },
    createdByRole: {
      type: String,
      default: 'faculty'
    },
    submittedBy: {
      type: [String],
      default: []
    },
    submissions: [
      {
        studentEnrollment: { type: String, trim: true },
        submittedAt: { type: Date, default: Date.now },
        status: { type: String, default: 'Submitted' }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Pre-save hook to populate combined dueDateTime for rapid, timezone-safe comparisons
AssignmentSchema.pre('save', function () {
  if (this.dueDate && this.dueTime) {
    try {
      const [year, month, day] = this.dueDate.split('-').map(Number);
      const [hours, minutes] = this.dueTime.split(':').map(Number);
      // In IST (UTC+5:30)
      const dateObj = new Date(Date.UTC(year, month - 1, day, hours - 5, minutes - 30));
      this.dueDateTime = dateObj;
    } catch (e) {
      // Fallback
    }
  }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
