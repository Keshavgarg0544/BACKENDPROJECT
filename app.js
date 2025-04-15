const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 3101;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use('/public', express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

const session = require('express-session');

app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: true
  
}));
app.use('/admin', require('./routes/admin'));
app.use('/teacher', require('./routes/teacher'));
app.use('/student', require('./routes/student'));

app.get('/', (req, res) => res.render('index'));
app.get('/choose', (req, res) => res.render('choose-role'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
