const mongoose = require('mongoose')

const couponUserSchema = new mongoose.Schema({
    coupon:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:'Coupon',
        required:true

    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    usedAt:{
        type:Date,
        default:Date.now
    }
})


const CouponUsage = mongoose.model("CouponUsage",couponUserSchema)

module.exports = CouponUsage