// ─────────────────────────────────────────────────────────
// isBeneficiary — ensures user is logged in AND has beneficiary role
// Unauthenticated → redirect to /login
// Wrong role → redirect to own dashboard
// ─────────────────────────────────────────────────────────

const isBeneficiary = (req, res, next) => {

  // Not logged in at all
  if (!req.session || !req.session.user) {

    return res.redirect('/login');

  }

  // Logged in but not beneficiary
  if (req.session.user.role !== 'beneficiary') {

    const role = req.session.user.role;

    if (role === 'admin') {

      return res.redirect('/admin/dashboard');

    }

    if (role === 'donor') {

      return res.redirect('/donor/dashboard');

    }

    return res.redirect('/');

  }

  // Beneficiary confirmed → proceed
  next();

};

module.exports = isBeneficiary;
