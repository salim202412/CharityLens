const express = require('express');
const router = express.Router();
const multer = require('multer');

const Case = require('../models/Case');
const isBeneficiary =
  require('../middleware/isBeneficiary');
const isAuth = require('../middleware/isAuth');


// ----------------------
// multer storage setup
// ----------------------

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }

});

const upload = multer({ storage });


// ----------------------
// submit new case
// ----------------------

router.post(
  '/cases/submit',
  isAuth,
  upload.single('proofImage'),

  async (req, res) => {

    try {

      const {
        title,
        description,
        category,
        requiredAmount,
        priority
      } = req.body;

      const cleanAmount =
Number(
    requiredAmount.replace(/,/g, '')
);


      // validation
      if (!title || !description || !category || !requiredAmount) {
        return res.status(400).json({
          message: "All required fields must be filled"
        });
      }


      // create new case
      const newCase = new Case({

        title,
        description,
        category,
        requiredAmount: cleanAmount,
        priority,

        beneficiaryId: req.session.user.id,

        proofImage: req.file
          ? `/uploads/${req.file.filename}`
          : null

      });


      // save case
      await newCase.save();


      // response
      res.redirect('/beneficiary/dashboard');

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: "Server error"
      });

    }

  }
);


// ----------------------
// get logged-in beneficiary cases
// ----------------------

router.get('/beneficiary/my-cases', isAuth, async (req, res) => {

  try {

    // find cases created by logged-in user
    const cases = await Case.find({
      beneficiaryId: req.session.user.id
    });

    // send response
    res.render(

  'beneficiary/my-cases',

  {

    cases

  }

);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ----------------------
// get verified active cases
// ----------------------

router.get('/cases', async (req, res) => {

  try {

    // fetch verified and active cases
    const cases = await Case.find({
      isVerified: true,
      isClosed: false,
      isRejected: false
    })

    // sort by highest priority first
    .sort({ priority: -1 })

    // show beneficiary details
    .populate('beneficiaryId', 'name email');



    // response
    res.status(200).json({
      totalCases: cases.length,
      cases
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

// ----------------------
// get single case details
// ----------------------

router.get('/cases/:id', async (req, res) => {

  try {

    // get case id from URL
    const caseId = req.params.id;

    // find case
    const foundCase = await Case.findById(caseId)
      .populate('beneficiaryId', 'name email');

    // check if case exists
    if (!foundCase) {
      return res.status(404).json({
        message: "Case not found"
      });
    }

    // calculate progress percentage
    const progress =
      (foundCase.collectedAmount / foundCase.requiredAmount) * 100;

    // response
    res.status(200).json({

      case: foundCase,

      progress: progress.toFixed(2) + '%'

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

// ----------------------
// render cases page
// ----------------------

router.get('/cases-view', async (req, res) => {

  try {

    const cases = await Case.find({
      isVerified: true,
      isClosed: false,
      isRejected: false
    }).sort({ priority: -1 });

    res.render('cases/list', { cases });

  } catch (error) {

    console.error(error);

    res.status(500).send("Server error");

  }

});

// ----------------------
// render single case detail page
// ----------------------

router.get('/cases-view/:id', async (req, res) => {

  try {

    // get case id
    const caseId = req.params.id;

    // find case
    const foundCase = await Case.findById(caseId)
      .populate('beneficiaryId', 'name email');


    // check case exists
    if (!foundCase) {
      return res.status(404).send("Case not found");
    }

    if (
    foundCase.isRejected ||
    !foundCase.isVerified ||
    foundCase.isClosed
) {

    return res.redirect(
        '/cases-view'
    );

}

    // render page
   res.render('cases/detail', {

  foundCase,

  razorpayKey: process.env.RAZORPAY_KEY_ID

});

  } catch (error) {

    console.error(error);

    res.status(500).send("Server error");

  }

});

// ----------------------
// beneficiary dashboard
// ----------------------

router.get('/beneficiary/dashboard', isAuth, async (req, res) => {

  try {

    // fetch beneficiary cases
    const cases = await Case.find({

      beneficiaryId: req.session.user.id

    })

    // latest first
    .sort({ createdAt: -1 });


    // render dashboard
   console.log(req.session.user);

   const totalRaised = cases.reduce(
  (sum, c) => sum + (c.collectedAmount || 0),
  0
);

const pendingCases = cases.filter(
  c => !c.isVerified
).length;

const approvedCases = cases.filter(
  c => c.isVerified
).length;

console.log("BENEFICIARY DASHBOARD ROUTE HIT");
console.log(totalRaised);

res.render('beneficiary/dashboard', {
    cases,
    user: req.session.user,
    totalRaised,
    pendingCases,
    approvedCases
});

  } catch (error) {

    console.error(error);

    res.status(500).send("Server error");

  }

});

// ----------------------
// render submit case page
// ----------------------

router.get(

  '/submit-case',

  isBeneficiary,

  (req, res) => {

    res.render('beneficiary/submit-case', {
    user: req.session.user
});

  }

);
module.exports = router;