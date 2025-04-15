const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true
  },
  remark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
