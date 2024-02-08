// app/models/Product.js
const mongoose = require("mongoose");

const Category = require("../models/category")

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  isListed: { type: Boolean, default: true },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
