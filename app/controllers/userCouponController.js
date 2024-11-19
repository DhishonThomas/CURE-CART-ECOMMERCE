const Coupon = require("../models/coupon");

const CouponUsage = require("../models/userCoupon");

const userCouponController = {
  applyCoupon: async (req, res) => {
    try {
      let { couponCode } = req.body;
      couponCode = couponCode.trim(" ");
      const userId = res.locals.user;
      const coupon = await Coupon.findOne({
        code: couponCode,
        isListed: true,
        validUntil: { $gte: new Date() },
      });
      if (!coupon) {
        return res
          .status(400)
          .json({ message: "Invalid or expired coupon code" });
      }

      const existingUsage = await CouponUsage.findOne({
        coupon: coupon._id,
        user: userId,
      });

      if (existingUsage&&existingUsage.maxUsageCount>0) {
        return res.status(400).json({ message: "Already used" });
      }
      const userCart = res.locals.userCartNumber;
      let updatedTotalAmount = userCart.totalAmount;
      // updatedTotalAmount -= (updatedTotalAmount * coupon.discountPercentage) / 100;
      updatedTotalAmount -= coupon.discountPercentage;
      res.json({ success: true, updatedTotalAmount: updatedTotalAmount });
    } catch (error) {
      console.log(error);
    }
  },
};

module.exports = userCouponController;
