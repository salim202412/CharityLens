// loading environment variables from .env file
require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');



const app = express();

// security headers
app.use(helmet());


// connecting database
connectDB();


// ----------------------
// middleware section
// ----------------------

// to read JSON data (for APIs)
app.use(express.json());

// prevent NoSQL injection
app.use((req, res, next) => {

  if (req.body) {

    mongoSanitize.sanitize(req.body);

  }

  next();

});


// prevent XSS


// to read form data (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// to serve static files like css, js, images
app.use(express.static(path.join(__dirname, 'public')));

// session setup (to keep user logged in)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // will be true in production (https)
    httpOnly: true
  }
}));


// setting view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {

  res.locals.req = req;

  next();

});
// ----------------------
// routes section
// ----------------------

// auth routes (register, login, logout)
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// dashboard route (only logged-in users)
const dashboardRoutes = require('./routes/dashboard');
app.use('/', dashboardRoutes);

// admin route (only admin users)
const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);

// case routes
const caseRoutes = require('./routes/cases');
app.use('/', caseRoutes);
//donationRoutes
const donationRoutes = require('./routes/donation');
app.use('/', donationRoutes);

// ----------------------
// pages rendering
// ----------------------

// register page
app.get('/register', (req, res) => {
  res.render('register');
});

// login page
app.get('/login', (req, res) => {
  res.render('login');
});


// home route (just to check app is running)
app.get('/', (req, res) => {

  res.render('home');

});


// starting server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});