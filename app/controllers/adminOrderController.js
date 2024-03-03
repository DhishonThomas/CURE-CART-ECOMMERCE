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
const { error, log } = require("console");





const orderList = async (req, res) => {
  try {
    const page =parseInt(req.query.page) ||  1 ;
    const perPage = 6
    const totalOrders = await  Order.find().countDocuments()
    const totalPages = Math.ceil(totalOrders /perPage )
    const orders = await Order.find()
      .populate("user")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    if (!orders) {
      throw new Error("No orders");
    }
    res.render("admin/orders", { orders, totalPages: totalPages , currentPage : page});
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
console.log("eut9e8ruteriy8fhjehu7ewui",order.paymentStatus);
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

const orderPlaced =  async(req,res)=>{

  console.log(req.body);
  const {orderId,productId}=req.body

  const order = await Order.findOne({_id:orderId}).exec()
  const itemToUpdate = order.items.find((item)=>item.product.toString()===productId)
    itemToUpdate.orderStatus = "Delivered";
order.paymentStatus = "Completed";

      const updatedOrder = await order.save();
  res.json({
          message: "Order cancelled successfully",
          order: updatedOrder,
          success: true,
        });

}

const returnOrder=async(req,res)=>{
  try{
const {orderId,productId} = req.body

const order = await Order.findOne({_id:orderId}).exec()
const itemToUpdate = order.items.find((item)=>item.product.toString()===productId)


itemToUpdate.orderStatus = "ReturnOk"
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


const status = async (req, res) => {

const status = req.query.status;
console.log(status);
 const page = parseInt(req.query.page) || 1;
 const perPage = 6;
 const totalOrders = await Order.find({
   "items.orderStatus": status,
 }).countDocuments();
 const totalPages = Math.ceil(totalOrders / perPage);

 const orders = await Order.find({ "items.orderStatus": status },)
   .populate("user")
   .sort({ updatedAt: -1 })
   .skip((page - 1) * perPage)
   .limit(perPage);

//  const orders = await Order.aggregate([
//    {
//      $match: {
//        "items.orderStatus": status,
//      },
//    },
//    {
//      $lookup: {
//        from: "products",
//        localField: "items.product",
//        foreignField: "_id",
//        as: "productDetails",
//      },
//    },
//    {
//      $lookup: {
//        from: "users", 
//        localField: "user", 
//        foreignField: "_id",
//        as: "userData", 
//      },
//    },

//    {
//      $project: {
//        _id: 1,
//        orderId: 1,
//        user: {
//          $arrayElemAt: ["$userData", 0],
//        },
//        totalAmount: 1,
//        items: 1,
//        productDetails: 1,
//        createdAt: 1,
//      },
//    },
//  ]);


 

 res.render("admin/orders",{orders,totalPages:totalPages,currentPage:page})
}





module.exports = {
  orderList,
  orderDetails,
  orderCancel,
  orderPlaced,
  returnOrder,
  status,
};