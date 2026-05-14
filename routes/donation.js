const express = require('express');
const router = express.Router();

const crypto = require('crypto');

const {
  body,
  validationResult
} = require('express-validator');


const razorpayInstance =
  require('../config/razorpay');

const Donation =
  require('../models/Donation');

const Case =
  require('../models/Case');

const isDonor =
  require('../middleware/isDonor');


// ----------------------
// create razorpay order
// ----------------------

router.post(

  '/donate/:caseId/create-order',

  [

    body('amount')
      .isFloat({ min: 1 })
      .withMessage(
        'Donation amount must be greater than 0'
      )

  ],

  isDonor,

  async (req, res) => {

    try {

      // validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {

        return res.status(400).json({

          errors: errors.array()

        });

      }


      // get case id
      const caseId = req.params.caseId;

      // get amount
      const { amount } = req.body;


      // find case
      const foundCase =
        await Case.findById(caseId);


      // case not found
      if (!foundCase) {

        return res.status(404).json({

          message: "Case not found"

        });

      }


      // check case closed
      if (foundCase.isClosed) {

        return res.status(400).json({

          message:
            "This case is already closed"

        });

      }


      // remaining amount
      const remainingAmount =

        foundCase.requiredAmount -
        foundCase.collectedAmount;


      // prevent over-funding
      if (amount > remainingAmount) {

        return res.status(400).json({

          message:
            `Only ₹${remainingAmount} is needed for this case`

        });

      }


      // create razorpay order
      const options = {

        amount: amount * 100,

        currency: 'INR',

        receipt: `receipt_${Date.now()}`

      };


      const order =
        await razorpayInstance
          .orders
          .create(options);


      // save donation
      const donation = new Donation({

        donorId:
          req.session.user.id,

        caseId,

        amount,

        razorpayOrderId: order.id,

        status: 'pending'

      });


      await donation.save();


      // response
      res.status(201).json({

        message:
          "Order created successfully",

        order,

        donation

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message: "Server error"

      });

    }

  }

);


// ----------------------
// verify razorpay payment
// ----------------------

router.post(

  '/donate/verify',

  isDonor,

  async (req, res) => {

    try {

      const {

        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature

      } = req.body;


      // generate expected signature
      const generatedSignature = crypto

        .createHmac(
          'sha256',
          process.env.RAZORPAY_KEY_SECRET
        )

        .update(
          razorpay_order_id +
          "|" +
          razorpay_payment_id
        )

        .digest('hex');


      // compare signatures
      if (
        generatedSignature !==
        razorpay_signature
      ) {

        return res.status(400).json({

          message:
            "Invalid payment signature"

        });

      }


      // find donation
      const donation =
        await Donation.findOne({

          razorpayOrderId:
            razorpay_order_id

        });


      // donation not found
      if (!donation) {

        return res.status(404).json({

          message:
            "Donation not found"

        });

      }


      // update donation
      donation.razorpayPaymentId =
        razorpay_payment_id;

      donation.status = 'success';

      await donation.save();


      // update case
      const foundCase =
        await Case.findById(
          donation.caseId
        );


      foundCase.collectedAmount +=
        donation.amount;


      // auto close case
      if (

        foundCase.collectedAmount >=
        foundCase.requiredAmount

      ) {

        foundCase.isClosed = true;

      }


      await foundCase.save();


      // response
      res.status(200).json({

        message:
          "Payment verified successfully",

        donation

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        message: "Server error"

      });

    }

  }

);


// ----------------------
// donor dashboard
// ----------------------

router.get(

  '/donor/dashboard',

  isDonor,

  async (req, res) => {

    try {

      // fetch donations
      const donations =
        await Donation.find({

          donorId:
            req.session.user.id

        })

        .populate('caseId', 'title')

        .sort({ createdAt: -1 });


      // calculate total donated
      const totalDonated = donations

        .filter(
          d => d.status === 'success'
        )

        .reduce((sum, donation) => {

          return sum + donation.amount;

        }, 0);


      // render page
      res.render(

        'donor/dashboard',

        {

          donations,

          totalDonated

        }

      );

    } catch (error) {

      console.error(error);

      res.status(500).send(
        "Server error"
      );

    }

  }

);


module.exports = router;