const mongoose = require('mongoose');

const bcrypt = require('bcrypt');


// ======================
// USER SCHEMA
// ======================

const userSchema = new mongoose.Schema({

    name: {

        type: String,

        required: true,

        trim: true

    },

    email: {

        type: String,

        required: true,

        unique: true,

        lowercase: true,

        trim: true

    },

    password: {

        type: String,

        required: true

    },

    role: {

        type: String,

        enum: [

            'donor',
            'beneficiary',
            'admin'

        ],

        default: 'donor'

    },

    // forgot password token
    resetPasswordToken: {

        type: String

    },

    // token expiry
    resetPasswordExpires: {

    type: Date

},

// Email OTP
emailOTP: {

    type: String

},

emailOTPExpires: {

    type: Date

},

// Email verification
isVerified: {

    type: Boolean,

    default: false

},

createdAt: {

    type: Date,

    default: Date.now

}
});


// ======================
// HASH PASSWORD
// ======================

userSchema.pre('save', async function() {

    // skip if password unchanged
    if (!this.isModified('password')) {

        return;

    }

    // generate salt
    const salt = await bcrypt.genSalt(10);

    // hash password
    this.password = await bcrypt.hash(

        this.password,

        salt

    );

});


// ======================
// COMPARE PASSWORD
// ======================

userSchema.methods.comparePassword = async function(password) {

    return await bcrypt.compare(

        password,

        this.password

    );

};


// ======================
// EXPORT MODEL
// ======================

module.exports = mongoose.model(

    'User',

    userSchema

);