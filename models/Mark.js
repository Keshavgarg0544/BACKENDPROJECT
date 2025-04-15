const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
  marks: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= this.outOf; // Marks should not exceed outOf
      },
      message: props => `Marks should be between 0 and ${props.value.outOf}`
    }
  },
  outOf: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Midterm', 'Endterm', 'Unit Test', 'Assignment', 'Practical', 'Other'],
    default: 'Other'
  },
  date: {
    type: String,
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Marks', marksSchema);
