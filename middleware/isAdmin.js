// ─────────────────────────────────────────────────────────
// isAdmin — ensures user is logged in AND has admin role
// Unauthenticated → saves returnTo, redirects to /login
// Wrong role → redirects to own dashboard
// ─────────────────────────────────────────────────────────

const isAdmin = (req, res, next) => {

  if (!req.session || !req.session.user) {

    // Save the URL the user was trying to reach
    req.session.returnTo = req.originalUrl;

    return res.redirect('/login');

  }

  if (req.session.user.role !== 'admin') {

    const role = req.session.user.role;

    if (role === 'donor')       return res.redirect('/donor/dashboard');
    if (role === 'beneficiary') return res.redirect('/beneficiary/dashboard');

    return res.redirect('/');

  }

  next();

};

module.exports = isAdmin;
