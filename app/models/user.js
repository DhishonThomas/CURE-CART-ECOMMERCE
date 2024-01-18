const mongoose = require("mongoose")

const userShcema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phonenumber: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified:{
    type:Boolean,
    default:true
  },
  isBlocked:{
    type:Boolean,
    default:true
  }
});
const User = mongoose.model('User',userShcema)
module.exports = User