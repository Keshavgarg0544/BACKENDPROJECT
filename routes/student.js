const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Student = require('../models/Student');
const Circular = require('../models/Circular'); 
const multer = require('multer');
const path = require('path');
const Attendance = require('../models/Attendance');  
const Subject = require('../models/Subject');
const Marks = require('../models/Mark');

router.get('/login', (req, res) => {
  res.render('student/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { rollno, password } = req.body;

  try {
    const student = await Student.findOne({ rollno });

    if (!student) {
      return res.render('student/login', { error: 'Invalid Roll No.' });
    }

    if (student.password !== password) {
      return res.render('student/login', { error: 'Incorrect password' });
    }

    req.session.studentId = student._id;
    req.session.rollno = student.rollno;

    res.redirect('/student/dashboard');

  } catch (err) {
    console.error(err);
    res.render('student/login', { error: 'Something went wrong' });
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');  
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage: storage });
router.get('/dashboard', async (req, res) => {
  if (!req.session.studentId) {
    return res.redirect('/student/login');
  }

  try {
    const circulars = await Circular.find().sort({ date: -1 });

    circulars.forEach(circular => {
      circular.document = '/uploads/' + circular.document.split('/uploads/')[1]; 
    });

    res.render('student/dashboard', {
      student: req.session,
      circulars,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.render('student/dashboard', {
      student: req.session,
      error: 'Something went wrong while fetching circulars.'
    });
  }
});
router.post('/circulars', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { title, description } = req.body;
  const documentPath = '/uploads/' + req.file.filename;  

  const circular = new Circular({
    title,
    description,
    document: documentPath 
  });

  await circular.save();
  res.sendStatus(200);  
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to log out');
    }
    res.redirect('/student/login');
  });
});
router.get('/attendance', async (req, res) => {
  try {
    const studentId = req.session.studentId; 

    const attendanceData = await Attendance.find({ studentId });

    if (!attendanceData || attendanceData.length === 0) {
      return res.render('student/attendance', { attendanceStats: [], error: 'No attendance data found' });
    }

    const attendanceStats = attendanceData.reduce((stats, attendance) => {
      const subject = attendance.subject;  
      const status = attendance.status;

      if (!stats[subject]) {
        stats[subject] = { attended: 0, total: 0 };
      }

      stats[subject].total++;  
      if (status === 'Present') {
        stats[subject].attended++;  
      }

      return stats;
    }, {});

    const statsArray = Object.keys(attendanceStats).map(subjectName => {
      const { attended, total } = attendanceStats[subjectName];
      const percentage = ((attended / total) * 100).toFixed(2);
      return { subject: subjectName, attended, total, percentage };
    });

    const error = statsArray.length === 0 ? 'No attendance data available for your subjects.' : null;

    res.render('student/attendance', { attendanceStats: statsArray, error });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching attendance data');
  }
});router.get('/marks', async (req, res) => {
  try {
    const studentId = req.session.studentId;  

    const marksData = await Marks.find({ studentId })
                                 .populate('subject')
                                 .select('marks outOf type subject date'); 

    if (!marksData || marksData.length === 0) {
      return res.render('student/marks', { marksStats: [], error: 'No marks data found' });
    }

    const marksStats = marksData.reduce((stats, mark) => {
      const subjectName = mark.subject;  
      const totalMarks = mark.outOf;
      const marksGiven = mark.marks;
      const examType = mark.type;  
      const examDate = mark.date;  

      if (!stats[subjectName]) {
        stats[subjectName] = { 
          exams: []  
        };
      }

      const examPercentage = ((marksGiven / totalMarks) * 100).toFixed(2);

      stats[subjectName].exams.push({
        marksGiven,
        totalMarks,
        examType,
        examDate,
        examPercentage 
      });

      return stats;
    }, {});

    const statsArray = Object.keys(marksStats).map(subjectName => {
      const { exams } = marksStats[subjectName];

      const totalMarksGiven = exams.reduce((acc, exam) => acc + exam.marksGiven, 0);
      const totalOutOf = exams.reduce((acc, exam) => acc + exam.totalMarks, 0);

      const overallPercentage = ((totalMarksGiven / totalOutOf) * 100).toFixed(2);

      return { 
        subject: subjectName, 
        exams,  
        totalMarksGiven, 
        totalOutOf,  
        overallPercentage,  
      };
    });

    const error = statsArray.length === 0 ? 'No marks data available for your subjects.' : null;

    res.render('student/marks', { marksStats: statsArray, error });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching marks data');
  }
});


module.exports = router;
