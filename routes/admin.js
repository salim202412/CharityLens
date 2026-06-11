const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');

const isAdmin = require('../middleware/isAdmin');
const Case = require('../models/Case');


// ----------------------
// admin dashboard
// ----------------------

router.get('/admin', isAdmin, (req, res) => {
  res.send("Welcome Admin");
});


// ----------------------
// get all cases with filters
// ----------------------

router.get('/admin/cases', isAdmin, async (req, res) => {

  try {

    // filter object
    const filter = {};

    // pending cases
    if (req.query.status === 'pending') {
      filter.isVerified = false;
      filter.isClosed = false;
    }

    // verified cases
    if (req.query.status === 'verified') {
      filter.isVerified = true;
      filter.isClosed = false;
    }

    // closed cases
    if (req.query.status === 'closed') {
      filter.isClosed = true;
    }

    // fetch cases
    const cases = await Case.find(filter)
      .populate('beneficiaryId', 'name email');

    // response
    res.render(

  'admin/cases',

  {

    cases,
    user: req.session.user

  }

);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

router.get('/admin/cases/:id', isAdmin, async (req, res) => {

    try {

        const singleCase = await Case.findById(
            req.params.id
        ).populate(
            'beneficiaryId',
            'name email'
        );

        if (!singleCase) {

            return res.status(404).send(
                'Case not found'
            );

        }

        res.render('admin/case-details', {

            singleCase,

            user: req.session.user

        });

    } catch (error) {

        console.error(error);

        res.status(500).send(
            'Server Error'
        );

    }

});

// ─────────────────────────────────────────────────────────────
// PRIORITY ENGINE — helper: compute score + label + bypass
// ─────────────────────────────────────────────────────────────

function computePriority(urgency, impact, sustainability) {

  const u = Number(urgency) || 0;
  const i = Number(impact) || 0;
  const s = Number(sustainability) || 0;

  // Emergency bypass rule: urgency >= 9
  if (u >= 9) {
    return {
      urgency: u,
      impact: i,
      sustainability: s,
      priorityScore: 10,
      priority: 'Critical',
      emergencyBypass: true
    };
  }

  // Weighted formula
  const score = parseFloat(
    ((u * 0.40) + (i * 0.35) + (s * 0.25)).toFixed(2)
  );

  // Label mapping
  let label;
  if (score >= 8.5)       label = 'Critical';
  else if (score >= 7)    label = 'High';
  else if (score >= 5)    label = 'Medium';
  else                    label = 'Low';

  return {
    urgency: u,
    impact: i,
    sustainability: s,
    priorityScore: score,
    priority: label,
    emergencyBypass: false
  };
}

// ----------------------
// verify case and assign priority (NEW weighted system)
// ----------------------

router.post('/admin/cases/:id/verify', isAdmin, async (req, res) => {

  try {

    // get case id from URL
    const caseId = req.params.id;

    // get the three scoring factors from form
    const { urgency, impact, sustainability } = req.body;

    // find case
    const foundCase = await Case.findById(caseId);

    // check if case exists
    if (!foundCase) {
      return res.status(404).json({
        message: "Case not found"
      });
    }

    // compute weighted priority
    const result = computePriority(urgency, impact, sustainability);

    // apply all priority fields
    foundCase.urgency        = result.urgency;
    foundCase.impact         = result.impact;
    foundCase.sustainability = result.sustainability;
    foundCase.priorityScore  = result.priorityScore;
    foundCase.priority       = result.priority;
    foundCase.emergencyBypass = result.emergencyBypass;

    // verify case
    foundCase.isVerified = true;

    // save changes
    await foundCase.save();

    // response
    res.redirect('/admin/cases');

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

// ----------------------
// reject case with reason
// ----------------------

router.post('/admin/cases/:id/reject', isAdmin, async (req, res) => {

  try {

    // get case id from URL
    const caseId = req.params.id;

    // get rejection reason
    const { reason } = req.body;

    // find case
    const foundCase = await Case.findById(caseId);

    // check if case exists
    if (!foundCase) {
      return res.status(404).json({
        message: "Case not found"
      });
    }

    // mark case as rejected
    foundCase.isRejected = true;

    // save rejection reason
    foundCase.rejectionReason = reason || "No reason provided";

    // save changes
    await foundCase.save();

    // response
    res.redirect('/admin/cases');

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

// ----------------------
// manually close case
// ----------------------

router.post('/admin/cases/:id/close', isAdmin, async (req, res) => {

  try {

    // get case id from URL
    const caseId = req.params.id;

    // find case
    const foundCase = await Case.findById(caseId);

    // check if case exists
    if (!foundCase) {
      return res.status(404).json({
        message: "Case not found"
      });
    }

    // close case
    foundCase.isClosed = true;

    // save changes
    await foundCase.save();

    // response
    res.redirect('/admin/cases');

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

// ----------------------
// render admin cases page
// ----------------------

router.get('/admin/cases-view', isAdmin, async (req, res) => {

  try {

    // fetch all cases
    const cases = await Case.find()
      .populate('beneficiaryId', 'name email');

    // render page
    res.render('admin/cases', { cases, user: req.session.user });

  } catch (error) {

    console.error(error);

    res.status(500).send("Server error");

  }

});

// ----------------------
// admin dashboard stats
// ----------------------

router.get('/admin/dashboard', isAdmin, async (req, res) => {

  try {

    // total raised amount
    const successfulDonations = await Donation.find({
      status: 'success'
    });

    const totalRaised = successfulDonations.reduce(
      (sum, donation) => {

        return sum + donation.amount;

      }, 0
    );


    // open cases count
    const openCases = await Case.countDocuments({
      isClosed: false
    });


    // closed cases count
    const closedCases = await Case.countDocuments({
      isClosed: true
    });


    // total donors count
    const totalDonors = await User.countDocuments({
      role: 'donor'
    });


   // pending verification count
const pendingVerifications =
  await Case.countDocuments({

    isVerified: false,
    isRejected: false

  });


// recent donations
const recentDonations = await Donation.find()

  .populate('donorId', 'name')

  .populate('caseId', 'title')

  .sort({ createdAt: -1 })

  .limit(5);


// render dashboard
res.render('admin/dashboard', {

  totalRaised,

  openCases,

  closedCases,

  totalDonors,

  pendingVerifications,

  recentDonations,

  user: req.session.user

});

  } catch (error) {

    console.error(error);

    res.status(500).send("Server error");

  }

});
module.exports = router;
