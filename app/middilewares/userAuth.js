const userAuthMiddileware = (req, res, next) => {
  if (req.session.isUserAuth) {
    next();
  } else {
    res.render("/signIn");
  }
};

module.exports = userAuthMiddileware;
