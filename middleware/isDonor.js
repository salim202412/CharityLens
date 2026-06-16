// ─────────────────────────────────────────────────────────
// isDonor — ensures user is logged in AND has donor role
// Unauthenticated → saves returnTo, redirects to /login
// Wrong role → redirects to own dashboard
// ─────────────────────────────────────────────────────────

const isDonor = (req, res, next) => {

  if (!req.session || !req.session.user) {

    // Save the URL the user was trying to reach
    req.session.returnTo = req.originalUrl;

    return res.redirect('/login');

  }

  if (req.session.user.role !== 'donor') {

    const role = req.session.user.role;

    if (role === 'admin')       return res.redirect('/admin/dashboard');
    if (role === 'beneficiary') return res.redirect('/beneficiary/dashboard');

    return res.redirect('/');

  }

  next();

};

module.exports = isDonor;
