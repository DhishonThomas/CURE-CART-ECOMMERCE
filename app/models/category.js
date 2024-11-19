const mongoose = require('mongoose');
const Offer = require("../models/offer")
const categorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isListed: { type: Boolean, default: true },
  offer:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Offer",
default:null
  },
  count:{
    type:Number,
    default:0
  }
});

  const Category = mongoose.model("Category", categorySchema);

  module.exports = Category;
