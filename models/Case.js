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

  // ── PRIORITY ENGINE ──────────────────────────────────────

  // Admin-assigned urgency score (1-10)
  urgency: {
    type: Number,
    default: null
  },

  // Admin-assigned impact score (1-10)
  impact: {
    type: Number,
    default: null
  },

  // Admin-assigned sustainability score (1-10)
  sustainability: {
    type: Number,
    default: null
  },

  // Computed weighted score: (U×0.40)+(I×0.35)+(S×0.25)
  priorityScore: {
    type: Number,
    default: 0
  },

  // Priority label: Low / Medium / High / Critical
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },

  // Emergency bypass: true if urgency >= 9
  emergencyBypass: {
    type: Boolean,
    default: false
  },

  // ─────────────────────────────────────────────────────────

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
