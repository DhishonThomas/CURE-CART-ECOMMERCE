const Coupon = require("../models/coupon")

const CouponUsage = require("../models/userCoupon")

const userCouponController = {
  applyCoupon:async(req,res)=>{
try{
    const { couponCode } = req.body;
const userId = res.locals.user
console.log(req.body);
        const coupon = await Coupon.findOne({
          code: couponCode,
          isListed: true,
          validUntil: { $gte: new Date() },
        });
console.log("coupon worked", coupon);
if (!coupon) {
  return res.status(400).json({ message: "Invalid or expired coupon code" });
}

const existingUsage = await CouponUsage.findOne({
  coupon: coupon._id,
  user: userId,
});

console.log("existingUsage worked",  existingUsage);
if (existingUsage) {
  return res.status(400).json({ message: "Already used"  });
}
const userCart = res.locals.userCartNumber
console.log(userCart,"cart number");
let updatedTotalAmount = userCart.totalAmount
        // updatedTotalAmount -= (updatedTotalAmount * coupon.discountPercentage) / 100;
updatedTotalAmount -= coupon.discountPercentage;
    console.log(updatedTotalAmount);
res.json({ success: true, updatedTotalAmount: updatedTotalAmount });
}catch(error){
    console.log(error);
}
  },
};

module.exports = userCouponController;