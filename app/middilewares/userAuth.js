const UserCart = require("../models/cartItem");
const userAuthMiddleware =async (req, res, next) => {
  if (req.session.isUserAuth) {
  console.log("req.session.isUserAuth====>", req.session.isUserAuth);
  // console.log("isUserAuth====>",isUserAuth);
    res.locals.user = req.session.isUserAuth;
    const userId =  res.locals.user
    res.locals.userCartNumber = await UserCart.findOne({
       userId: userId,
    }).populate("cartItems.productId");
    console.log("fgdsfgdfsgfdgdsfgdfgs",res.locals.userCartNumber);
//  const userCartN = await UserCart.findOne({
//       userId: userId,
//     }).populate("cartItems.productId");
//     if(userCartN){
//       res.locals.userCartNumber = userCartN
//     }else{
//       res.locals.userCartNumber = 0
//     }
    next();
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = userAuthMiddleware
 