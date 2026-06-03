const express = require('express');

const router = express.Router();

const User = require('../models/User');

const crypto = require('crypto');

const nodemailer = require('nodemailer');

const {
    body,
    validationResult
} = require('express-validator');

const rateLimit = require('express-rate-limit');


// ======================
// NODEMAILER
// ======================

const transporter = nodemailer.createTransport({

    host: 'smtp.gmail.com',

    port: 465,

    secure: true,

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});


// ======================
// LOGIN LIMITER
// ======================

const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    message: {

        message:
            "Too many login attempts. Try again later."

    }

});


// ======================
// REGISTER LIMITER
// ======================

const registerLimiter = rateLimit({

    windowMs: 60 * 60 * 1000,

    max: 5,

    message: {

        message:
            "Too many registrations from this IP."

    }

});


// ======================
// RENDER REGISTER
// ======================

router.get('/register', (req, res) => {

    res.render('register', {

        error: null

    });

});


// ======================
// RENDER LOGIN
// ======================

router.get('/login', (req, res) => {

    res.render('login');

});


// ======================
// RENDER FORGOT PASSWORD
// ======================

router.get('/forgot-password', (req, res) => {

    res.render('forgot-password', {

        success: false

    });

});


// ======================
// REGISTER
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

            const errors = validationResult(req);

            if (!errors.isEmpty()) {

    return res.render('register', {

        error: 'Invalid input'

    });

}

            const {

                name,
                email,
                password,
                role

            } = req.body;


            // prevent admin registration
            if (role === 'admin') {

                return res.status(403).send(

                    "Admin account cannot be created"

                );

            }


            // existing user
            const existingUser =

                await User.findOne({ email });

           if (existingUser) {

    return res.render('register', {

        error: 'Email already exists'

    });

}


           // generate OTP
const otp = Math.floor(
    100000 + Math.random() * 900000
).toString();


// store registration data
req.session.pendingUser = {

    name,
    email,
    password,
    role: role || 'donor'

};


// store otp
req.session.registrationOTP = otp;


// 10 minutes expiry
req.session.otpExpiry =

    Date.now() + (10 * 60 * 1000);


// send email
await transporter.sendMail({

    from: process.env.EMAIL_USER,

    to: email,

    subject:
        'CharityLens Email Verification',

    html: `

        <h2>Email Verification</h2>

        <p>Your OTP is:</p>

        <h1>${otp}</h1>

        <p>
            This OTP expires in 10 minutes.
        </p>

    `

});


// render OTP page
res.render('verify-otp', {

    email

});

        } catch (error) {

            console.error(error);

            res.status(500).send(
                "Server Error"
            );

        }

    }

);



// ======================
// VERIFY OTP
// ======================

router.post(

    '/verify-otp',

    async (req, res) => {

        try {

            const { otp } = req.body;


            if (

                !req.session.registrationOTP ||

                !req.session.pendingUser

            ) {

                return res.send(

                    'OTP session expired'

                );

            }


            if (

                Date.now() >

                req.session.otpExpiry

            ) {

                return res.send(

                    'OTP expired'

                );

            }


            if (

                otp !==

                req.session.registrationOTP

            ) {

                return res.send(

                    'Invalid OTP'

                );

            }


            // create actual user

            const user = new User({

                ...req.session.pendingUser

            });

            await user.save();


            // clear session data

            delete req.session.pendingUser;

            delete req.session.registrationOTP;

            delete req.session.otpExpiry;


            res.redirect('/login');

        }

        catch (error) {

            console.error(error);

            res.status(500).send(
                'Server Error'
            );

        }

    }

);
// ======================
// LOGIN
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
            const user = await User.findOne({ email });

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


            // session
            req.session.user = {

                id: user._id,

                name: user.name,

                role: user.role

            };


            // redirect by role
            if (user.role === 'admin') {

                return res.redirect(
                    '/admin/dashboard'
                );

            }

            if (user.role === 'donor') {

                return res.redirect(
                    '/donor/dashboard'
                );

            }

            if (user.role === 'beneficiary') {

                return res.redirect(
                    '/beneficiary/dashboard'
                );

            }

            res.redirect('/');

        } catch (error) {

            console.error(error);

            res.status(500).send(
                "Server Error"
            );

        }

    }

);



// ======================
// FORGOT PASSWORD
// ======================

router.post('/forgot-password', async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.send(
                "No account found with this email"
            );

        }


        // generate token
        const token = crypto

            .randomBytes(32)

            .toString('hex');


        // save token
        user.resetPasswordToken = token;

        user.resetPasswordExpires =

            Date.now() + 3600000;

        await user.save();


        // reset url
        const resetURL =

            `http://localhost:4000/auth/reset-password/${token}`;


        // send email
        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: user.email,

            subject: 'CharityLens Password Reset',

            html: `

                <div style="font-family: Arial; padding:20px;">

                    <h2>Password Reset</h2>

                    <p>
                        Click the button below
                        to reset your password.
                    </p>

                    <a href="${resetURL}"

                    style="
                        background:#16a34a;
                        color:white;
                        padding:12px 20px;
                        text-decoration:none;
                        border-radius:8px;
                        display:inline-block;
                        margin-top:10px;
                    ">

                        Reset Password

                    </a>

                    <p style="margin-top:20px;">
                        This link expires in 1 hour.
                    </p>

                </div>

            `

        });

        res.render('forgot-password', {
          success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Server Error"
        );

    }

});


// ======================
// RENDER RESET PASSWORD
// ======================

router.get('/reset-password/:token',

    async (req, res) => {

        try {

            const user = await User.findOne({

                resetPasswordToken:
                    req.params.token,

                resetPasswordExpires:
                    { $gt: Date.now() }

            });

            if (!user) {

                return res.send(

                    "Invalid or expired token"

                );

            }

            res.render('reset-password', {

                token: req.params.token

            });

        } catch (error) {

            console.error(error);

            res.status(500).send(
                "Server Error"
            );

        }

    }

);


// ======================
// RESET PASSWORD
// ======================

router.post('/reset-password/:token',

    async (req, res) => {

        try {

            const user = await User.findOne({

                resetPasswordToken:
                    req.params.token,

                resetPasswordExpires:
                    { $gt: Date.now() }

            });

            if (!user) {

                return res.send(

                    "Invalid or expired token"

                );

            }


            // set new password
            user.password = req.body.password;

            // clear reset fields
            user.resetPasswordToken = undefined;

            user.resetPasswordExpires = undefined;

            await user.save();


            res.redirect('/login');

        } catch (error) {

            console.error(error);

            res.status(500).send(
                "Server Error"
            );

        }

    }

);


// ======================
// LOGOUT
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