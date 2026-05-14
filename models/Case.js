const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({

  // case title
  title: {
    type: String,
    required: true,
    trim: true
  },

  // detailed description of the case
  description: {
    type: String,
    required: true
  },

  // category of donation case
  category: {
    type: String,
    enum: ['Masjid', 'DarulUloom', 'Individual'],
    required: true
  },

  // total amount needed
  requiredAmount: {
    type: Number,
    required: true
  },

  // amount collected so far
  collectedAmount: {
    type: Number,
    default: 0
  },

  // whether admin verified the case
  isVerified: {
    type: Boolean,
    default: false
  },

  // whether donation target is completed
  isClosed: {
    type: Boolean,
    default: false
  },
  // whether admin rejected the case
    isRejected: {
    type: Boolean,
    default: false
  },

// reason for rejection
    rejectionReason: {
    type: String,
    default: null
    },

  // higher value = higher priority
  priority: {
    type: Number,
    default: 0
  },

  // beneficiary who created the case
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // image proof/document proof
  proofImage: {
    type: String
  },

  // case creation date
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Case', caseSchema);