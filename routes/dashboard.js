const express = require('express');

const router = express.Router();

const isAuth = require('../middleware/isAuth');

const Case = require('../models/Case');

const Donation = require('../models/Donation');


// =========================
// GENERAL DASHBOARD
// =========================

router.get('/dashboard', isAuth, (req, res) => {

    res.send(
        `Welcome ${req.session.user.name}, you are logged in`
    );

});


// =========================
// BENEFICIARY DASHBOARD
// =========================

router.get(
    '/beneficiary/dashboard',

    isAuth,

    async (req, res) => {

        try {

            if (
                req.session.user.role !==
                'beneficiary'
            ) {

                return res.redirect('/');
            }

            const cases =
                await Case.find({

                    beneficiaryId:
                        req.session.user.id

                });

            const totalRaised = cases.reduce(

    (sum, singleCase) =>

        sum + (singleCase.collectedAmount || 0),

    0
);

const pendingCases = cases.filter(

    singleCase =>
        !singleCase.isVerified &&
        !singleCase.isRejected

).length;

const approvedCases = cases.filter(

    singleCase => singleCase.isVerified

).length;

const rejectedCases = cases.filter(

    singleCase => singleCase.isRejected

).length;

const activeCases = cases.filter(

    singleCase => !singleCase.isRejected

).length;            
                res.render(
                'beneficiary/dashboard',

                {
                    user: req.session.user,
                    cases,
                    totalRaised,
                    pendingCases,
                    approvedCases,
                    rejectedCases,
                    activeCases
                }
            );

        } catch (error) {

            console.error(error);

            res.status(500).send(
                'Server Error'
            );
        }
    }
);


// =========================
// BENEFICIARY MY CASES
// =========================

router.get(
    '/beneficiary/my-cases',

    isAuth,

    async (req, res) => {

        try {

            if (
                req.session.user.role !==
                'beneficiary'
            ) {

                return res.redirect('/');
            }

            const cases =
                await Case.find({

                    beneficiaryId:
                        req.session.user.id

                });

            res.render(
                'beneficiary/my-cases',

                {
                    user: req.session.user,
                    cases
                }
            );

        } catch (error) {

            console.error(error);

            res.status(500).send(
                'Server Error'
            );
        }
    }
);


// =========================
// DONOR DASHBOARD
// =========================

router.get(
    '/donor/dashboard',

    isAuth,

    async (req, res) => {

        try {

            if (
                req.session.user.role !==
                'donor'
            ) {

                return res.redirect('/');
            }

            const donations =
                await Donation.find({

                    donorId:
                        req.session.user.id

                }).populate('caseId');

            const totalDonated =
                donations.reduce(

                    (sum, donation) =>

                        sum + donation.amount,

                    0
                );

            res.render(
                'donor/dashboard',

                {
                    user: req.session.user,
                    donations,
                    totalDonated
                }
            );

        } catch (error) {

            console.error(error);

            res.status(500).send(
                'Server Error'
            );
        }
    }
);


module.exports = router;