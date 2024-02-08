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
});

const orderSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    items:[orderItemSchema],
    totalAmount:{
        type:Number,
        required:true,
    },
    shippingAddress:{
        type:String,
        required:true,
    },
    paymentMethod:{
        type:String,
        required : true,
    },
    paymentStatus:{
        type:String,
        enum:['Pending','Completed','Failed'],
        default:'Pending'
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})


const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
