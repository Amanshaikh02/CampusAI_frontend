const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true
    },
    room: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true
    },
    faculty: {
      type: String,
      required: [true, 'Assigned faculty is required'],
      trim: true
    },
    dept: {
      type: String,
      enum: ['AIML', 'Cyber Security', 'All Departments'],
      default: 'All Departments'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Class', ClassSchema);
