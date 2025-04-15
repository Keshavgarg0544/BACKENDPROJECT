const mongoose = require('mongoose');

const circularSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  document: { type: String }, 
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Circular', circularSchema);
