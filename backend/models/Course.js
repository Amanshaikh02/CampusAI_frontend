const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true
    },
    dept: {
      type: String,
      enum: ['AIML', 'Cyber Security', 'All Departments'],
      default: 'All Departments'
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      default: 3
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Course', CourseSchema);
