const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: String,
    email: String,
    password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);
