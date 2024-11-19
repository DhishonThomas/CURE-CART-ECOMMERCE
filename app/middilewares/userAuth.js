const UserCart = require("../models/cartItem");
const Category = require("../models/category");
const WishList = require("../models/wishlist")

const userAuthMiddleware =async (req, res, next) => {
  if (req.session.isUserAuth) {
  console.log("req.session.isUserAuth====>", req.session.isUserAuth);
  // console.log("isUserAuth====>",isUserAuth);
    res.locals.user = req.session.isUserAuth;
    const userId =  res.locals.user
    res.locals.userCartNumber = await UserCart.findOne({
       userId: userId,
    }).populate("cartItems.productId");

    res.locals.userWishlistNumber = await WishList.findOne({ user:userId })
//  const userCartN = await UserCart.findOne({
//       userId: userId,
//     }).populate("cartItems.productId");
//     if(userCartN){
//       res.locals.userCartNumber = userCartN
//     }else{
//       res.locals.userCartNumber = 0
//     }
res.locals.categorys = await Category.find();
    next(); 
  } else {
    res.locals.categorys = await Category.find();

    res.locals.user = null;
    next();
  }
};

module.exports = userAuthMiddleware
 