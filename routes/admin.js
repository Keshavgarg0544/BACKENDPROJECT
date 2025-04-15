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

router.get('/', (req, res) => res.redirect('/admin/login'));

router.get('/signup', (req, res) => res.render('admin/signup', { message: '' }));

router.post('/signup', async (req, res) => {
  const { username, name, email, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.render('admin/signup', { message: 'User already exists!' });

    const newUser = new User({ username, name, email, password });
    await newUser.save();
    res.render('admin/login', { message: 'Signup successful! Please login.' });
  } catch (err) {
    console.error(err);
    res.render('admin/signup', { message: 'Something went wrong.' });
  }
});

router.get('/login', (req, res) => res.render('admin/login', { message: '' }));

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.render('admin/login', { message: 'Invalid credentials!' });
    req.session.user = user;
   
    const studentCount = await Student.countDocuments();
    const teacherCount = await Teacher.countDocuments();

    res.render('admin/dashhome', { studentCount, teacherCount });
  } catch (err) {
    console.error(err);
    res.render('admin/login', { message: 'Login failed. Try again.' });
  }
});


router.get('/dashome', async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    res.render('admin/dashhome', { studentCount, teacherCount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get('/admindash', (req, res) => res.render('admin/dashboard'));

router.get('/registeruser', async (req, res) => {
  try {
    const classes = await Class.find();
    res.render('admin/student', { classes });
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
    res.redirect('/admin/show');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving student.');
  }
});

router.get('/show', async (req, res) => {
  const users = await Student.find().populate('classId');
  res.render('admin/show', { users });
});

router.get('/edit/:id', async (req, res) => {
  const student = await Student.findById(req.params.id);
  const classes = await Class.find();
  if (!student) return res.status(404).send('Student not found');
  res.render('admin/edit', { user: student, classes });
});

router.post('/edit/:id', async (req, res) => {
  const { fname, lname, age, fathername, mobno, batch, classId, password, rollno } = req.body;
  await Student.findByIdAndUpdate(req.params.id, {
    fname, lname, age, fathername, mobno, batch, rollno, classId, password,
  });
  res.redirect('/admin/show');
});

router.get('/delete/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/admin/show');
});


router.get('/class', async (req, res) => {
  const classes = await Class.find();
  res.render('admin/class', { classes });
});

router.post('/class/add', async (req, res) => {
  const { className } = req.body;
  try {
    await Class.create({ name: className });
    res.redirect('/admin/class');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding class.');
  }
});

router.post('/class/delete/:id', async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.redirect('/admin/class');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting class.");
  }
});

router.get('/subject', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('classId');
    const classes = await Class.find();
    res.render('admin/subject', { subjects, classes });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading subjects.');
  }
});

router.post('/subject/add', async (req, res) => {
  const { subjectName, subjectCode, classId } = req.body;
  try {
    await Subject.create({ name: subjectName, subjectCode, classId });
    res.redirect('/admin/subject');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding subject.');
  }
});

router.get('/subject/delete/:id', async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.redirect('/admin/subject');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting subject.');
  }
});


router.get('/teacher-dashboard', async (req, res) => {
  try {
    const teacherCount = await Teacher.countDocuments();
    const studentCount = await Student.countDocuments();
    res.render('admin/teacher-dashboard', { teacherCount, studentCount });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.get('/registerteacher', async (req, res) => {
  try {
    const classes = await Class.find();
    const subjects = await Subject.find();
    res.render('admin/teacher', { classes, subjects });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading teacher registration form.');
  }
});

router.post('/registerteacher', async (req, res) => {
  const { fname, lname, age, subject, classId, email, password } = req.body;

  try {
    const existing = await Teacher.findOne({ email });
    if (existing) {
      const classes = await Class.find();
      const subjects = await Subject.find();
      return res.status(400).render('admin/teacher', {
        error: 'Email is already registered!',
        classes,
        subjects
      });
    }

    const teacher = new Teacher({ fname, lname, age, subject, classId, email, password });
    await teacher.save();
    res.redirect('/admin/showteachers');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error saving teacher');
  }
});

router.get('/showteachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('classId').populate('subject');
    res.render('admin/showteachers', { teachers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching teachers.');
  }
});

router.get('/editteacher/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('classId').populate('subject');
    const classes = await Class.find();
    const subjects = await Subject.find();
    if (!teacher) return res.status(404).send('Teacher not found');
    res.render('admin/editteacher', { teacher, classes, subjects });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error editing teacher.');
  }
});

router.post('/editteacher/:id', async (req, res) => {
  const { fname, lname, age, subject, classId, email, password } = req.body;
  try {
    await Teacher.findByIdAndUpdate(req.params.id, {
      fname, lname, age, subject, classId, email, password
    });
    res.redirect('/admin/showteachers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating teacher.');
  }
});

router.get('/deleteteacher/:id', async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.redirect('/admin/showteachers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting teacher.');
  }
});


async function calculateAttendanceStats(students, subject) {
  const stats = {};

  for (const student of students) {
    const records = await Attendance.find({
      studentId: student._id,
      subject: subject.trim()
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    stats[student._id] = { total, present, percentage };
  }

  return stats;
}

async function calculateTodaySummary(students, subject, date) {
  let presentCount = 0;
  let absentCount = 0;

  for (const student of students) {
    const record = await Attendance.findOne({
      studentId: student._id,
      subject,
      date
    });

    if (record?.status === 'Present') presentCount++;
    else absentCount++;
  }

  const todayPercentage =
    students.length > 0
      ? Math.round((presentCount / students.length) * 100)
      : 0;

  return { presentCount, absentCount, todayPercentage };
}

router.get('/attendance', async (req, res) => {
  const students = await Student.find({});
  const subjects = await Subject.find({});
  const selectedSubject = subjects[0]?.name || '';
  const todayDate = new Date().toISOString().split('T')[0];

  const attendanceStats = await calculateAttendanceStats(students, selectedSubject);
  const { presentCount, absentCount, todayPercentage } = await calculateTodaySummary(
    students,
    selectedSubject,
    todayDate
  );

  res.render('admin/attendance', {
    students,
    subjects,
    selectedSubject,
    attendanceStats,
    todayDate,
    presentCount,
    absentCount,
    todayPercentage
  });
});

router.post('/attendance', async (req, res) => {
  const { attendance = {}, subject, date, remarks = {} } = req.body;

  const students = await Student.find({});
  const subjects = await Subject.find({});
  const todayDate = date || new Date().toISOString().split('T')[0];

  for (const student of students) {
    const status = attendance[student._id] || 'Absent'; // default to Absent
    const remark = remarks[student._id] || '';

    await Attendance.findOneAndUpdate(
      { studentId: student._id, subject, date: todayDate },
      { studentId: student._id, subject, date: todayDate, status, remark },
      { upsert: true, new: true }
    );
  }

  const attendanceStats = await calculateAttendanceStats(students, subject);
  const { presentCount, absentCount, todayPercentage } = await calculateTodaySummary(
    students,
    subject,
    todayDate
  );

  res.render('admin/attendance', {
    students,
    subjects,
    selectedSubject: subject,
    attendanceStats,
    todayDate,
    presentCount,
    absentCount,
    todayPercentage
  });
});



function getToday() {
  return new Date().toISOString().split('T')[0];
}

router.get('/marks', async (req, res) => {
  const students = await Student.find({});
  const subjects = await Subject.find({});
  const selectedSubject = req.query.subject || subjects[0]?.name || '';
  const date = getToday();

  const records = await Mark.find({ subject: selectedSubject, date });

  const marksMap = {};
  let total = 0, max = -Infinity, min = Infinity;

  records.forEach(r => {
    marksMap[r.studentId] = {
      marks: r.marks,
      outOf: r.outOf
    };
    total += r.marks;
    if (r.marks > max) max = r.marks;
    if (r.marks < min) min = r.marks;
  });

  const avg = records.length > 0 ? Math.round(total / records.length) : 0;
  const outOf = records[0]?.outOf || 100;

  res.render('admin/marks', {
    students,
    subjects,
    selectedSubject,
    todayDate: date,
    avgMarks: avg,
    maxMarks: max === -Infinity ? 0 : max,
    minMarks: min === Infinity ? 0 : min,
    outOf,
    marksMap
  });
});

router.post('/marks', async (req, res) => {
  console.log("POST /admin/marks route hit!");
  try {
    const { date, subject, examType, marks, outOf } = req.body;

    

    const outOfValue = parseInt(outOf, 10); 

    if (isNaN(outOfValue) || outOfValue < 1) {
      return res.status(400).send('Invalid outOf value.');
    }
    for (const studentId in marks) {
      const markValue = parseFloat(marks[studentId]);
      if (isNaN(markValue) || markValue < 0) {
        console.error(`Invalid marks value for student ${studentId}`);
        return res.status(400).send(`Invalid marks value for student ${studentId}`);
      }
      await Mark.findOneAndUpdate(
        { studentId, subject, date },
        {
          studentId,
          subject,
          marks: markValue,
          outOf: outOfValue,
          type: examType,
          date
        },
        { upsert: true, new: true }
      );
    }

    res.redirect('/admin/marks');
  } catch (err) {
    console.error("Error occurred while saving marks:", err);
    res.status(500).send('Error saving marks');
  }
});


router.get('/profile', async (req, res) => {
  const sessionUser = req.session.user;

  if (!sessionUser) {
    return res.redirect('/admin/login');
  }

  try {
    const user = await User.findById(sessionUser._id);
    if (!user) {
      req.session.destroy();
      return res.redirect('/admin/login');
    }

    res.render('admin/profile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
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

router.get('/circulars', async (req, res) => {
  const circulars = await Circular.find().sort({ date: -1 });
  res.render('admin/circulars', { circulars });
});

router.get('/circulars/:id', async (req, res) => {
  const circular = await Circular.findById(req.params.id);
  res.json(circular);
});

router.post('/circulars', upload.single('document'), async (req, res) => {
  const { title, description } = req.body;
  const documentPath = req.file ? '/uploads/' + req.file.filename : null;

  const circular = new Circular({
    title,
    description,
    document: documentPath
  });

  await circular.save();
  res.sendStatus(200);
});

router.put('/circulars/:id', upload.single('document'), async (req, res) => {
  const { title, description } = req.body;
  const documentPath = req.file ? '/uploads/' + req.file.filename : undefined;

  const updateData = { title, description };
  if (documentPath) updateData.document = documentPath;

  await Circular.findByIdAndUpdate(req.params.id, updateData);
  res.sendStatus(200); 
});


router.delete('/circulars/:id', async (req, res) => {
  try {
    const circular = await Circular.findById(req.params.id);

    if (!circular) {
      console.log('Circular not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Circular not found' });
    }
    if (circular.document) {
      const filePath = path.join(__dirname, '..', 'public', circular.document);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error checking file stats:', err);
        } else {
         
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting the file:', err);
            } else {
              console.log('File deleted successfully:', filePath);
            }
          });
        }
      });
    }

    await Circular.findByIdAndDelete(req.params.id);

    res.json({ message: 'Circular deleted successfully' });
  } catch (err) {
    console.error('Error deleting circular:', err);
    res.status(500).json({ message: 'Server error, unable to delete circular', error: err.message });
  }
});

module.exports = router;
