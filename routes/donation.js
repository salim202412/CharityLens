const express = require('express');
const router = express.Router();

const crypto = require('crypto');

const {
  body,
  param,
  validationResult
} = require('express-validator');

const razorpayInstance = require('../config/razorpay');
const Donation = require('../models/Donation');
const Case = require('../models/Case');
const isDonor = require('../middleware/isDonor');

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array()
    });

    return true;
  }

  return false;
};

const signaturesMatch = (expectedSignature, receivedSignature) => {
  if (
    typeof receivedSignature !== 'string' ||
    expectedSignature.length !== receivedSignature.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
};

const emitDonationProgress = (req, foundCase) => {
  const io = req.app.get('io');

  if (!io) {
    return;
  }

  io.emit('newDonation', {
    caseId: foundCase._id.toString(),
    collectedAmount: foundCase.collectedAmount,
    progress: Math.min(
      (foundCase.collectedAmount / foundCase.requiredAmount) * 100,
      100
    )
  });
};

// ----------------------
// create razorpay order
// ----------------------

router.post(
  '/donate/:caseId/create-order',
  [
    param('caseId')
      .isMongoId()
      .withMessage('Invalid case id'),
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Donation amount must be greater than 0')
      .toFloat()
  ],
  isDonor,
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) {
        return;
      }

      const caseId = req.params.caseId;
      const { amount } = req.body;

      const foundCase = await Case.findById(caseId);

      if (!foundCase) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }

      if (foundCase.isRejected) {
        return res.status(400).json({
          message: 'This case has been rejected'
        });
      }

      if (!foundCase.isVerified) {
        return res.status(400).json({
          message: 'This case is not approved for donations'
        });
      }

      if (foundCase.isClosed) {
        return res.status(400).json({
          message: 'This case is already closed'
        });
      }

      const remainingAmount =
        foundCase.requiredAmount - foundCase.collectedAmount;

      if (remainingAmount <= 0) {
        return res.status(400).json({
          message: 'This case is already fully funded'
        });
      }

      if (amount > remainingAmount) {
        return res.status(400).json({
          message: `Only Rs. ${remainingAmount} is needed for this case`
        });
      }

      const options = {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      };

      const order = await razorpayInstance.orders.create(options);

      const donation = new Donation({
        donorId: req.session.user.id,
        caseId,
        amount,
        razorpayOrderId: order.id,
        status: 'pending'
      });

      await donation.save();

      res.status(201).json({
        message: 'Order created successfully',
        order,
        donation
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: 'Server error'
      });
    }
  }
);

// ----------------------
// verify razorpay payment
// ----------------------

router.post(
  '/donate/verify',
  [
    body('razorpay_order_id')
      .trim()
      .notEmpty()
      .withMessage('Razorpay order id is required'),
    body('razorpay_payment_id')
      .trim()
      .notEmpty()
      .withMessage('Razorpay payment id is required'),
    body('razorpay_signature')
      .trim()
      .notEmpty()
      .withMessage('Razorpay signature is required')
  ],
  isDonor,
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) {
        return;
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (!signaturesMatch(generatedSignature, razorpay_signature)) {
        return res.status(400).json({
          message: 'Invalid payment signature'
        });
      }

      const donation = await Donation.findOne({
        razorpayOrderId: razorpay_order_id,
        donorId: req.session.user.id
      });

      if (!donation) {
        return res.status(404).json({
          message: 'Donation not found'
        });
      }

      if (donation.status === 'success') {
        return res.status(200).json({
          message: 'Payment already verified',
          donation
        });
      }

      const verifiedDonation = await Donation.findOneAndUpdate(
        {
          _id: donation._id,
          status: { $ne: 'success' }
        },
        {
          razorpayPaymentId: razorpay_payment_id,
          status: 'success'
        },
        { new: true }
      );

      if (!verifiedDonation) {
        const latestDonation = await Donation.findById(donation._id);

        return res.status(200).json({
          message: 'Payment already verified',
          donation: latestDonation || donation
        });
      }

      const updatedCase = await Case.findOneAndUpdate(
        {
          _id: verifiedDonation.caseId,
          isRejected: false,
          isVerified: true,
          isClosed: false,
          $expr: {
            $gte: [
              {
                $subtract: ['$requiredAmount', '$collectedAmount']
              },
              verifiedDonation.amount
            ]
          }
        },
        {
          $inc: {
            collectedAmount: verifiedDonation.amount
          }
        },
        { new: true }
      );

      if (!updatedCase) {
        verifiedDonation.status = 'failed';
        await verifiedDonation.save();

        const currentCase = await Case.findById(verifiedDonation.caseId);

        if (!currentCase) {
          return res.status(404).json({
            message: 'Case not found'
          });
        }

        if (
          currentCase.isRejected ||
          !currentCase.isVerified ||
          currentCase.isClosed
        ) {
          return res.status(400).json({
            message: 'This case is not accepting donations'
          });
        }

        const remainingAmount =
          currentCase.requiredAmount - currentCase.collectedAmount;

        return res.status(400).json({
          message: remainingAmount > 0
            ? `Only Rs. ${remainingAmount} is needed for this case`
            : 'This case is already fully funded'
        });
      }

      if (updatedCase.collectedAmount >= updatedCase.requiredAmount) {
        updatedCase.isClosed = true;
        await updatedCase.save();
      }

      emitDonationProgress(req, updatedCase);

      res.status(200).json({
        message: 'Payment verified successfully',
        donation: verifiedDonation
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: 'Server error'
      });
    }
  }
);

// ----------------------
// payment failed
// ----------------------

router.post(
  '/donate/payment-failed',
  [
    body('razorpay_order_id')
      .trim()
      .notEmpty()
      .withMessage('Razorpay order id is required')
  ],
  isDonor,
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) {
        return;
      }

      const { razorpay_order_id } = req.body;

      const donation = await Donation.findOne({
        razorpayOrderId: razorpay_order_id,
        donorId: req.session.user.id
      });

      if (!donation) {
        return res.status(404).json({
          message: 'Donation not found'
        });
      }

      if (donation.status !== 'success') {
        donation.status = 'failed';
        await donation.save();
      }

      res.json({
        message: 'Donation marked as failed'
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: 'Server error'
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
      const donations = await Donation.find({
        donorId: req.session.user.id
      })
        .populate('caseId', 'title')
        .sort({ createdAt: -1 });

      const totalDonated = donations
        .filter(d => d.status === 'success')
        .reduce((sum, donation) => sum + donation.amount, 0);

      res.render('donor/dashboard', {
        donations,
        totalDonated
      });
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
