const express = require('express');
const router = express.Router();

const User = require('../models/User');

const {
  body,
  validationResult
} = require('express-validator');

const rateLimit = require('express-rate-limit');

// login limiter
const loginLimiter = rateLimit({

  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 5,

  message: {
    message:
      "Too many login attempts. Try again later."
  }

});


// register limiter
const registerLimiter = rateLimit({

  windowMs: 60 * 60 * 1000, // 1 hour

  max: 5,

  message: {
    message:
      "Too many registrations from this IP."
  }

});


// render register page
router.get('/register', (req, res) => {

  res.render('register');

});


// render login page
router.get('/login', (req, res) => {

  res.render('login');

});
// ======================
// 📝 POST /register
// ======================

router.post(

  '/register',

  registerLimiter,

  [

    body('name')
      .notEmpty()
      .withMessage('Name is required'),

    body('email')
      .isEmail()
      .withMessage('Valid email required'),

    body('password')
      .isLength({ min: 6 })
      .withMessage(
        'Password must be at least 6 characters'
      )

  ],

  async (req, res) => {

    try {

      // validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {

        return res.redirect(

  '/login?error=Invalid login details'

);

      }


      const {
        name,
        email,
        password,
        role
      } = req.body;


      // ❌ block admin role
      if (role === 'admin') {

        return res.status(403).json({

          message:
            "Admin account cannot be created"

        });

      }


      // check existing user
      const existingUser =
        await User.findOne({ email });

      if (existingUser) {

        return res.status(400).json({

          message: "Email already registered"

        });

      }


      // create user
      const user = new User({

        name,

        email,

        password,

        role: role || 'donor'

      });


      await user.save();


      // response
     res.redirect('/login');

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message: "Server error"

      });

    }

  }

);


// ======================
// 🔐 POST /login
// ======================

router.post(

  '/login',

  loginLimiter,

  [

    body('email')
      .isEmail()
      .withMessage('Valid email required'),

    body('password')
      .notEmpty()
      .withMessage('Password required')

  ],

  async (req, res) => {

    try {

      // validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {

       return res.redirect(

  '/login?error=Invalid login details'

);

      }


      const {
        email,
        password
      } = req.body;


      // find user
      const user =
        await User.findOne({ email });

      if (!user) {

       return res.redirect(

  '/login?error=Invalid email or password'

);

      }


      // compare password
      const isMatch =
        await user.comparePassword(password);

      if (!isMatch) {

       return res.redirect(

  '/login?error=Invalid email or password'

);

      }


      // store session
      req.session.user = {

        id: user._id,

        name: user.name,

        role: user.role

      };


      // response
     // redirect based on role

if (user.role === 'admin') {

  return res.redirect('/admin/dashboard');

}


if (user.role === 'donor') {

 return res.redirect('/cases-view');

}


if (user.role === 'beneficiary') {

  return res.redirect('/beneficiary/dashboard');

}


// fallback
res.redirect('/');

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message: "Server error"

      });

    }

  }

);


// ======================
// 🚪 GET /logout
// ======================

router.get('/logout', (req, res) => {

  req.session.destroy(err => {

    if (err) {

      return res.status(500).send(
        "Logout failed"
      );

    }

    res.clearCookie('connect.sid');

    res.redirect('/');

  });

});


module.exports = router;