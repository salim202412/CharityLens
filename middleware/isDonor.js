const isDonor = (req, res, next) => {

  // check login
  if (!req.session || !req.session.user) {

    return res.status(401).send(
      "Please login first"
    );

  }


  // check donor role
  if (req.session.user.role !== 'donor') {

    return res.status(403).send(
      "Donor access only"
    );

  }


  next();

};

module.exports = isDonor;