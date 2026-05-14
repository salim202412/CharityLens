const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');


// ======================
// 📊 GET /dashboard
// ======================
router.get('/dashboard', isAuth, (req, res) => {
  res.send(`Welcome ${req.session.user.name}, you are logged in`);
});


module.exports = router;