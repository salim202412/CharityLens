// ─────────────────────────────────────────────────────────
// isAdmin — ensures user is logged in AND has admin role
// Unauthenticated → redirect to /login
// Wrong role → redirect to own dashboard
// ─────────────────────────────────────────────────────────

const isAdmin = (req, res, next) => {

  // Not logged in at all
  if (!req.session || !req.session.user) {

    return res.redirect('/login');

  }

  // Logged in but not admin
  if (req.session.user.role !== 'admin') {

    // Send them to their own dashboard
    const role = req.session.user.role;

    if (role === 'donor') {

      return res.redirect('/donor/dashboard');

    }

    if (role === 'beneficiary') {

      return res.redirect('/beneficiary/dashboard');

    }

    return res.redirect('/');

  }

  // Admin confirmed → proceed
  next();

};

module.exports = isAdmin;
