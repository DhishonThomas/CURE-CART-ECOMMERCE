const userAuthMiddleware = (req, res, next) => {
  if (req.session.isUserAuth) {
  console.log("req.session.isUserAuth====>", req.session.isUserAuth);
  // console.log("isUserAuth====>",isUserAuth);
    res.locals.user = req.session.isUserAuth;
    next();
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = userAuthMiddleware
