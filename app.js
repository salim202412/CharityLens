// loading environment variables from .env file
require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const session = require('express-session');
const path = require('path');
const Case = require('./models/Case');
const mongoSanitize = require('express-mongo-sanitize');


const app = express();


// connecting database
connectDB();


// ─────────────────────────────────────────────────────────
// CORE MIDDLEWARE
// ─────────────────────────────────────────────────────────

// to read JSON data (for APIs)
app.use(express.json());

// prevent NoSQL injection
app.use((req, res, next) => {

  if (req.body) {

    mongoSanitize.sanitize(req.body);

  }

  next();

});

// to read form data (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// to serve static files like css, js, images
app.use(express.static(path.join(__dirname, 'public')));


// ─────────────────────────────────────────────────────────
// SESSION SETUP
// ─────────────────────────────────────────────────────────

app.use(session({

  secret: process.env.SESSION_SECRET,

  resave: false,

  saveUninitialized: false,

  rolling: true,

  cookie: {

    secure: false,     // set true in production with HTTPS

    httpOnly: true,    // prevent JS access to cookie

    sameSite: 'lax',   // CSRF protection

    maxAge: 1000 * 60 * 60 // 1 hour session lifetime

  }

}));


// ─────────────────────────────────────────────────────────
// CACHE-CONTROL — applied to EVERY response
// This forces the browser to never cache any page,
// so the Back button after logout cannot show stale pages.
// ─────────────────────────────────────────────────────────

app.use((req, res, next) => {

  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private'
  );

  res.setHeader(
    'Pragma',
    'no-cache'
  );

  res.setHeader(
    'Expires',
    '0'
  );

  next();

});


// ─────────────────────────────────────────────────────────
// GLOBAL SESSION LOCALS
// Makes req.user and res.locals.user available in all EJS
// ─────────────────────────────────────────────────────────

app.use((req, res, next) => {

  req.user = req.session.user || null;

  res.locals.user = req.user;

  res.locals.req = req;

  next();

});


// setting view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────

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

// donation routes
const donationRoutes = require('./routes/donation');
app.use('/', donationRoutes);


// ─────────────────────────────────────────────────────────
// PAGE ROUTES
// ─────────────────────────────────────────────────────────

// register page
app.get('/register', (req, res) => {

  // Already logged in → send to own dashboard
  if (req.session && req.session.user) {

    return redirectToDashboard(req.session.user.role, res);

  }

  res.render('register');

});


// login page — redirect to dashboard if already authenticated
app.get('/login', (req, res) => {

  // Already logged in → redirect to their dashboard
  if (req.session && req.session.user) {

    return redirectToDashboard(req.session.user.role, res);

  }

  res.render('login', {

    redirect: req.query.redirect || ''

  });

});


// home route
app.get('/', async (req, res) => {

  try {

    const masjidCount =
      await Case.countDocuments({

        category: 'Masjid',
        isVerified: true,
        isRejected: false,
        isClosed: false

      });

    const darulUloomCount =
      await Case.countDocuments({

        category: 'DarulUloom',
        isVerified: true,
        isRejected: false,
        isClosed: false

      });

    const individualCount =
      await Case.countDocuments({

        category: 'Individual',
        isVerified: true,
        isRejected: false,
        isClosed: false

      });

    res.render('home', {

      masjidCount,
      darulUloomCount,
      individualCount

    });

  } catch (error) {

    console.error(error);

    res.status(500).send('Server Error');

  }

});


// ─────────────────────────────────────────────────────────
// HELPER: redirect to role-specific dashboard
// Used on login page and register page when already logged in
// ─────────────────────────────────────────────────────────

function redirectToDashboard(role, res) {

  if (role === 'admin') {

    return res.redirect('/admin/dashboard');

  }

  if (role === 'donor') {

    return res.redirect('/donor/dashboard');

  }

  if (role === 'beneficiary') {

    return res.redirect('/beneficiary/dashboard');

  }

  return res.redirect('/');

}


// starting server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
