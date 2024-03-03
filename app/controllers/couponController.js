const Coupon = require("../models/coupon")

const CouponController = {
  coupon: async (req, res) => {
    try {
      const coupons = await Coupon.find();
      res.render("admin/coupon", { coupons: coupons });
    } catch (error) {
      console.log(error);
    }
  },
  addCoupon: async (req, res) => {
    try {
      const { code, discountPercentage, validForm, validUntil, maxUsageCount } =
        req.body;

      console.log(req.body);
      const discountAmount = parseInt(discountPercentage, 10);
      console.log(discountAmount);
      const newCoupon = new Coupon({
        code: code,
        discountPercentage: discountAmount,
        validForm: validForm,
        validUntil: validUntil,
        maxUsageCount: maxUsageCount,
      });

      await newCoupon.save();
      res.json({ success: true, message: "ok done" });
    } catch (error) {
      console.log(error);
    }
  },
  couponUlist: async (req, res) => {
    try {
      let couponId = req.params.id;
      console.log("couponIdgg", couponId);

      const coupon = await Coupon.findOne({ _id: couponId });
      if (!coupon) {
        res.json(404).send("The requested resource does not exist");
      } else {
        coupon.isListed = !coupon.isListed;
        await coupon.save();
        res.redirect("/admin/coupon");
      }
    } catch (error) {
      console.log(error);
    }
  },
  couponEdit: async (req, res) => {
    try {
      let couponId = req.params.id;
      console.log(couponId);
      const coupon = await Coupon.findOne({ _id: couponId });
      console.log(coupon);
      res.render("admin/couponEdit", { coupon: coupon });
    } catch (error) {
      console.log(error);
    }
  },
  couponUpdate: async (req, res) => {
    try {
      const {
        code,
        discountPercentage,
        validForm,
        validUntil,
        maxUsageCount,
        couponId,
      } = req.body;

      const coupon = await Coupon.findOneAndUpdate(
        { _id: couponId },
        {
          $set: {
            code: code,
            discountPercentage: discountPercentage,
            validForm: validForm,
            validUntil: validUntil,
            maxUsageCount: maxUsageCount,
          },
        }
      );

      await coupon.save();
      console.log(coupon);

      console.log("ghjdfghjfghj", couponId);

      console.log(req.body);
    } catch (error) {
      console.log(error);
    }
  },
  couponDelete:async(req,res)=>{
    try{

        let {couponId} = req.body
        console.log(couponId);

        const couponDelete = await Coupon.findOneAndDelete({ _id: couponId });

        if(couponDelete){
            res.json({success:true,message:"Coupon has been deleted"})
        }else{
            res.status(401).json({success:false,message:"No such coupon found!"})
        }
    }catch(error){
        console.log(error);
    }
  }
};

module.exports = CouponController
