// ─────────────────────────────────────────────────────────
// isDonor — ensures user is logged in AND has donor role
// Unauthenticated → redirect to /login
// Wrong role → redirect to own dashboard
// ─────────────────────────────────────────────────────────

const isDonor = (req, res, next) => {

  // Not logged in at all
  if (!req.session || !req.session.user) {

    return res.redirect('/login');

  }

  // Logged in but not donor
  if (req.session.user.role !== 'donor') {

    const role = req.session.user.role;

    if (role === 'admin') {

      return res.redirect('/admin/dashboard');

    }

    if (role === 'beneficiary') {

      return res.redirect('/beneficiary/dashboard');

    }

    return res.redirect('/');

  }

  // Donor confirmed → proceed
  next();

};

module.exports = isDonor;
