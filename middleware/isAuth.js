// ─────────────────────────────────────────────────────────
// isAuth — verifies a valid session exists
// Saves the originally requested URL to session before
// redirecting to login, so we can return there after login.
// ─────────────────────────────────────────────────────────

const isAuth = (req, res, next) => {

  if (req.session && req.session.user) {

    return next();

  }

  // Save the URL the user was trying to reach
  req.session.returnTo = req.originalUrl;

  return res.redirect('/login');

};

module.exports = isAuth;
