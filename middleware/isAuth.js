// ─────────────────────────────────────────────────────────
// isAuth — verifies a valid session exists
// Redirects to /login if not authenticated
// ─────────────────────────────────────────────────────────

const isAuth = (req, res, next) => {

  // Check active session with user object
  if (req.session && req.session.user) {

    return next();

  }

  // Not logged in → redirect to login
  return res.redirect('/login');

};

module.exports = isAuth;
