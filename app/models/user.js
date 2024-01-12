const mongoose = require("mongoose")

const userShcema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phonenumber: {
    type:Number,
    required:true
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User',userShcema)