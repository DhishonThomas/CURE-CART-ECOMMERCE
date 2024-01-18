const userAuthMiddleware = (req, res, next) => {
  if (req.session.isUserAuth) {
    res.locals.user = true;
    next();
  } else {
    res.locals.user = false;
    next();
  }
};

module.exports = userAuthMiddleware;
