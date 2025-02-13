const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: String,
  otp: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    expires: "1h",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});
const Userotp =mongoose.model("Userotp", otpSchema);
module.exports = Userotp;