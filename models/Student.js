const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  age: Number,
  fathername: String,
  mobno: String,
  batch: String,
  rollno:{
    type: String,
    required: true,
    unique: true
  } ,
  password: String,
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }
});

module.exports = mongoose.model('Student', studentSchema);
