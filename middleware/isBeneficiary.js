const isBeneficiary = (req, res, next) => {

  // check login
  if (!req.session || !req.session.user) {

    return res.status(401).send(
      "Please login first"
    );

  }


  // check beneficiary role
  if (
    req.session.user.role !== 'beneficiary'
  ) {

    return res.status(403).send(
      "Beneficiary access only"
    );

  }


  next();

};

module.exports = isBeneficiary;