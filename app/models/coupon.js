const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true
    },
    discountPercentage:{
        type:Number,
        required:true,
        
    },
    validForm:{
        type:Date,
        required:true,
    },
    validUntil:{
        type:Date,
        required:true,
    },
    maxUsageCount:{
        type:Number,
        default:1
    },
    isListed:{
        type:Boolean,
        default:true
    }
})


const Coupon = mongoose.model("Coupon",couponSchema)

module.exports = Coupon