const multer = require("multer");
const sharp = require("sharp");
const Product = require("../models/product");
const Admin = require("../models/admin");
const Category = require("../models/category");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs").promises;
const storage = multer.memoryStorage();
const uploads = multer({ storage: storage }).array("images", 15);
const User = require("../models/user");
const mongoose = require("mongoose");
const Order = require("../models/order");
const { error } = require("console");





const orderList = async (req, res) => {
  try {
    const orders = await Order.find().populate("user");

    if (!orders) {
      throw new Error("No orders");
    }
    res.render("admin/orders", { orders });
  } catch (error) {
    console.log(error);
  }
};


const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId);
    const order = await Order.findOne({ _id: orderId })
      .populate("items.product")
      .populate("user")
      .exec();
    console.log(order);
    if (!order) {
      return res.status(404).json({ msg: "Order Not Found" });
    }

    res.render("admin/orderDetail", { orders: order });
  } catch (error) {
    console.log(error);
  }
};

const orderCancel = async(req,res)=>{
  try{
    const { orderId, productId } = req.body;

    console.log("Server reached");

     const order = await Order.findOne({ _id: orderId }).exec();
     const itemToUpdate = order.items.find(
       (item) => item.product.toString() === productId
     );

    itemToUpdate.orderStatus = "OrderCanceled";

      const updatedOrder = await order.save();

        res.json({
          message: "Order cancelled successfully",
          order: updatedOrder,
          success: true,
        });
  }catch(error){
console.log(error);
  }
}




module.exports = {
  orderList,
  orderDetails,
  orderCancel,
};