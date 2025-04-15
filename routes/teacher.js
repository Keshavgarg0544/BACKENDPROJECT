const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

// GET login form
router.get('/login', (req, res) => {
  res.render('teacher/login', { error: null });
});

// POST login logic
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ email });

    if (!teacher || teacher.password !== password) {
      return res.render('teacher/login', { error: 'Invalid credentials' });
    }

    res.send('Teacher login successful');
  } catch (err) {
    console.error(err);
    res.render('teacher/login', { error: 'Something went wrong' });
  }
});

module.exports = router;
