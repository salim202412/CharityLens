const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({

  // donor who donated
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // case receiving donation
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },

  // donated amount
  amount: {
    type: Number,
    required: true
  },

  // razorpay order id
  razorpayOrderId: {
    type: String
  },

  // razorpay payment id
  razorpayPaymentId: {
    type: String
  },

  // payment status
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },

  // donation date
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Donation', donationSchema);