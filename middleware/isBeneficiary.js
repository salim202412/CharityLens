// ─────────────────────────────────────────────────────────
// isBeneficiary — ensures user is logged in AND has beneficiary role
// Unauthenticated → saves returnTo, redirects to /login
// Wrong role → redirects to own dashboard
// ─────────────────────────────────────────────────────────

const isBeneficiary = (req, res, next) => {

  if (!req.session || !req.session.user) {

    // Save the URL the user was trying to reach
    req.session.returnTo = req.originalUrl;

    return res.redirect('/login');

  }

  if (req.session.user.role !== 'beneficiary') {

    const role = req.session.user.role;

    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'donor') return res.redirect('/donor/dashboard');

    return res.redirect('/');

  }

  next();

};

module.exports = isBeneficiary;
