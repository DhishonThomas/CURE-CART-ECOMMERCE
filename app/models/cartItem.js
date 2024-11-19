const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true },
  price:{type:Number}
});

const userCartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  cartItems: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
});

const UserCart = mongoose.model("UserCart", userCartSchema);

module.exports = UserCart;
