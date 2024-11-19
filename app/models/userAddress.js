const mongoose = require("mongoose")

const User = require("../models/user")

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  address:{
    type:String,
    required:true
  },
  pinCode: {
    type: Number,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },

  state: {
    type: String,
    required: true,
  },
});
   

const UserAddressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    addresses:[addressSchema]
})


const UserAddress = mongoose.model("UserAddress",UserAddressSchema);

module.exports = UserAddress