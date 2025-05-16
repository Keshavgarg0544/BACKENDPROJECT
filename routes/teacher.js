const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/Admin');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Circular = require('../models/Circular');


function isAuthenticated(req, res, next) {
  if (req.session && req.session.teacherId) {
    return next();
  }
  res.redirect('/teacher/login');
}

// --- Session setup ---
// You need to add this in your main app.js/server.js (example below):
/*
const session = require('express-session');
app.use(session({
  secret: 'your_secret_key', // change to a strong secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure: true if HTTPS
}));
*/

// GET login page
router.get('/login', (req, res) => {
  res.render('teacher/login', { error: null });
});

// POST login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ email });

    if (!teacher || teacher.password !== password) {
      return res.render('teacher/login', { error: 'Invalid credentials' });
    }

    // Save teacher ID in session to keep logged in
    req.session.teacherId = teacher._id;

    // Redirect to dashboard after successful login
    res.redirect('/teacher/dashboard');
  } catch (err) {
    console.error(err);
    res.render('teacher/login', { error: 'Something went wrong' });
  }
});

// GET dashboard (protected route)
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    // Count students in DB
    const studentCount = await Student.countDocuments();

    res.render('teacher/dashboard', { studentCount });
  } catch (err) {
    console.error(err);
    res.render('teacher/dashboard', { studentCount: 0 });
  }
});

router.get('/StudentDash', (req, res) => res.render('teacher/StudentDash'));

router.get('/registeruser', async (req, res) => {
  try {
    const classes = await Class.find();
    res.render('teacher/student', { classes });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading registration form.');
  }
});

router.post('/registeruser', async (req, res) => {
  const { fname, lname, age, fathername, mobno, batch, classId, password, rollno } = req.body;
  try {
    const student = new Student({ fname, lname, age, fathername, mobno, batch, rollno, classId, password });
    await student.save();
    res.redirect('/teacher/show');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving student.');
  }
});
router.get('/show', async (req, res) => {
  const users = await Student.find().populate('classId');
  res.render('teacher/show', { users });
});

router.get('/edit/:id', async (req, res) => {
  const student = await Student.findById(req.params.id);
  const classes = await Class.find();
  if (!student) return res.status(404).send('Student not found');
  res.render('teacher/edit', { user: student, classes });
});

router.post('/edit/:id', async (req, res) => {
  const { fname, lname, age, fathername, mobno, batch, classId, password, rollno } = req.body;
  await Student.findByIdAndUpdate(req.params.id, {
    fname, lname, age, fathername, mobno, batch, rollno, classId, password,
  });
  res.redirect('/teacher/show');
});

router.get('/delete/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/teacher/show');
});



router.get('/profile', async (req, res) => {
  const teacherId = req.session.teacherId;

  if (!teacherId) {
    return res.redirect('/teacher/login');
  }

  try {
    const user = await Teacher.findById(teacherId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/teacher/login');
    }

    res.render('teacher/profile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



// GET logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/teacher/login');
  });
});

module.exports = router;
