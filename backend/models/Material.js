const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    targetDepartment: {
      type: String,
      default: 'All Departments'
    },
    targetType: {
      type: String,
      enum: ['all', 'department', 'individual'],
      default: 'all'
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
    course: {
      type: String,
      default: ''
    },
    semester: {
      type: String,
      default: ''
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
    description: {
      type: String,
      default: '',
      trim: true
    },
    uploadedBy: {
      type: String,
      default: 'Admin'
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN')
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Material', MaterialSchema);
