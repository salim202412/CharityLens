const isAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next(); // user is logged in
  }

  // If not logged in → redirect to login page
  return res.redirect('/login');
};

module.exports = isAuth;