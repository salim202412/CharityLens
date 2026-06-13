// loading environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const session = require('express-session');
const path = require('path');
const Case = require('./models/Case');
const mongoSanitize = require('express-mongo-sanitize');


const app = express();

const server = http.createServer(app);

const io = new Server(server);
app.set('io', io);

io.on('connection', socket => {

    console.log(
        'Socket connected:',
        socket.id
    );

});


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

  rolling: true,

  cookie: {

    secure: false,

    httpOnly: true,

    sameSite: 'lax',

    maxAge: 1000 * 60 * 60 // 1 hour

  }

}));

// =============================
// DISABLE CACHE FOR ALL PAGES
// =============================

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


// setting view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {

    req.user = req.session.user || null;

    res.locals.user = req.user;

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




// home route (just to check app is running)
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

// starting server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});