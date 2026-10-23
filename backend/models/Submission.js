const mongoose = require('mongoose');

const AnswerItemSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, default: '' },
    answer: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    studentEnrollment: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    answersList: {
      type: [AnswerItemSchema],
      default: []
    },
    answers: {
      type: String,
      required: [true, 'Answers are required for submission'],
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Submitted', 'Graded', 'Late'],
      default: 'Submitted'
    },
    marks: {
      type: String,
      default: '',
      trim: true
    },
    feedback: {
      type: String,
      default: '',
      trim: true
    },
    gradedBy: {
      type: String,
      default: ''
    },
    gradedAt: {
      type: Date,
      default: null
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
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee one active submission record per student per assignment
SubmissionSchema.index({ assignmentId: 1, studentEnrollment: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
