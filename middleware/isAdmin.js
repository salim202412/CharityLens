const isAdmin = (req, res, next) => {
  // Check if user is logged in
  if (!req.session || !req.session.user) {
    return res.status(401).send("Unauthorized: Please login first");
  }

  // Check if user role is admin
  if (req.session.user.role !== 'admin') {
    return res.status(403).send("Forbidden: Admin access only");
  }

  // If admin → allow access
  next();
};

module.exports = isAdmin;