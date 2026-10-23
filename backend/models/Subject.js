const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true
    },
    dept: {
      type: String,
      enum: ['AIML', 'Cyber Security', 'All Departments'],
      default: 'All Departments'
    },
    type: {
      type: String,
      required: [true, 'Subject type is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Subject', SubjectSchema);
