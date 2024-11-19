const mongoose = require("mongoose")


const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    enum: ["Pending","Order", "OrderCanceled", "Return", "Delivered","ReturnOk"],
    default: "Order",
  },
  reason:{
    type :String,
    
  }
});

const orderSchema = new mongoose.Schema({
  orderId:{

  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingAddress: {
    type: Object,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  razorpayOrderId: {
    type: String,
   
  },
  razorpayPaymentId:{
    type:String,
  },
}
  ,{
    timestamps: true, 
  }
);


const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
