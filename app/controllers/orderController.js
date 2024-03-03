const User = require("../models/user");
const bcrypt = require("bcrypt");
const Product = require("../models/product");
const mongoose = require("mongoose");
const UserCart = require("../models/cartItem");
const userAddress = require("../models/userAddress");
const Order = require("../models/order");
const Razorpay = require("razorpay");
const orderid = require("order-id")("key");
const Wallet = require("../models/wallet")
const Transaction = require("../models/transaction")
const PDFDocument = require("pdfkit");
const fs = require("fs");


const cron = require('node-cron')


async function generatePDF(orderDetails, filePath) {
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(16).text("Order Details", { align: "center" }).moveDown();

  doc.fontSize(12);
  doc.text(`Order ID: ${orderDetails.orderId}`).moveDown();
  doc.text(`Payment Method: ${orderDetails.paymentMethod}`).moveDown();
  doc.text(`Payment Status: ${orderDetails.paymentStatus}`).moveDown();
  doc.text(`Order Status: ${orderDetails.orderStatus}`).moveDown();

  doc.text("Customer Information", { align: "left" }).moveDown();
  doc.text(`Name: ${orderDetails.username}`).moveDown();
  doc.text(`Mobile Number: ${orderDetails.phonenumber}`).moveDown();
  doc.text(`Address: ${orderDetails.shippingAddress.address}`).moveDown(); 

  
  doc.text("Order Items", { align: "left" }).moveDown();
  console.log(orderDetails.items);
  orderDetails.items.forEach((item) => {
    doc.text(`Product: ${item.product}`).moveDown();
    doc.text(`Product Name: ${item.productName}`).moveDown();
    doc.text(`Quantity: ${item.quantity}`).moveDown();
    doc.text(`Price: ${item.price}`).moveDown();
    doc.text(`Total: ${item.total}`).moveDown();
  });

  // Add total amount
  doc.text(`Total Amount: ${orderDetails.totalAmount}`).moveDown();

  // Finalize the PDF
  doc.end();
}

module.exports = generatePDF;


async function refundOrder(order) {
  if (order.paymentMethod === "Razorpay") {
    const totalAmount = order.totalAmount;

    const refundResponse = await razorpay.refundOrder(
      order.razorpayOrderId,
      totalAmount
    );
    console.log("Razorpay refund response:", refundResponse);

    if (!refundResponse.success) {
      throw new Error("Razorpay refund failed");
    }

    const userId = order.user;
    const userWallet = await Wallet.findOne({ user: userId }).exec();

    if (!userWallet) {
      throw new Error("User wallet not found");
    }

    userWallet.balance += totalAmount;
    await userWallet.save();
  }
}

async function walletCredit(addMoney,
          user,
          razorpay_order_id){


            let wallet = await Wallet.findOne({user:user})

if(!wallet){
  wallet = new Wallet({ user: user });
}

const transaction = new Transaction({
  wallet: wallet._id,
  amount: addMoney,
  type: "credit",
});
let addMoneyNumber = parseInt(addMoney,10)
console.log("tranactionsss",transaction);
console.log(wallet.balance);
 wallet.balance += addMoneyNumber;
console.log(wallet.balance);
 await transaction.save()
let walletBalance = wallet.balance;
 await wallet.save()
 
 return walletBalance;



          }

async function orderPlaced(
  selectedAddressId,
  selectedPaymentOption,
  user,
  razorpay_order_id
) {
  console.log("Worked order");
  try {
    console.log(
      "selectedAddressId, selectedPaymentOption,user:::",
      selectedAddressId,
      selectedPaymentOption,
      user
    );

    const UserAddress = await userAddress
      .findOne({
        userId: user,
      })
      .exec();
    if (!UserAddress) {
      return res.status(404).json({ message: "User address not found" });
    }

    const address = UserAddress.addresses.find(
      (addr) => addr._id == selectedAddressId
    );

    console.log("Address", address);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    console.log("usercart start");

    const userCart = await UserCart.findOne({ userId: user });
    if (!userCart) {
      return res.status(404).json({ message: "User cart not found" });
    }
    console.log("usercart end");
    const { totalAmount } = userCart;
    const cartItems = userCart.cartItems;

    const orderItems = await Promise.all(
      cartItems.map(async (cartItem) => {
        const product = await Product.findById(cartItem.productId).exec();
        if (!product) {
          throw new Error("Product not found");
        }
        const price = product.price;
        return {
          product: cartItem.productId,
          quantity: cartItem.quantity,
          price: price,
        };
      })
    );

    const orderId = orderid.generate();
    const order = new Order({
      orderId: orderId,
      user: user,
      items: orderItems,
      totalAmount: totalAmount,
      shippingAddress: address,
      paymentMethod: selectedPaymentOption,
      razorpayOrderId: razorpay_order_id,

      paymentStatus:
        selectedPaymentOption === "Razorpay" ? "Completed" : "Pending",
    });
    console.log("order end");

    await order.save();
    console.log(order);

    await Promise.all(
      cartItems.map(async (cartItem) => {
        const product = await Product.findById(cartItem.productId).exec();
        if (product) {
          product.quantity -= cartItem.quantity;
          await product.save();
        }
      })
    );
    const carts = userCart.cartItems;
    console.log("userCart.cartItems===========================>>>>>>>", carts);
    userCart.cartItems = [];
    userCart.totalAmount = 0;
    await userCart.save();
    return order._id
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const razorpay = new Razorpay({
  key_id: "rzp_test_SsymjD3eNkPA50",
  key_secret: "Z22hM97tCz6grYcH1sJpXjxG",
});



const orderController = {
  walletCallback: async (req, res) => {
    const crypto = require("crypto");
    const secret = "Z22hM97tCz6grYcH1sJpXjxG";
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      addMoney,
    } = req.body;
    function generateSignature(order_id, razorpay_payment_id) {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(order_id + "|" + razorpay_payment_id);
      return hmac.digest("hex");
    }
    console.log("razorpay_signature ", razorpay_signature);

    console.log(
      "razorpay_payment_id, razorpay_order_id",
      razorpay_payment_id,
      razorpay_order_id
    );

    try {
      const generatedSignature = generateSignature(
        razorpay_order_id,
        razorpay_payment_id
      );
      console.log(
        "generatedSignature++++razorpay_signature",
        generatedSignature,
        razorpay_signature
      );

      if (generatedSignature === razorpay_signature) {
        console.log("Payment successful");
        const user = res.locals.user;
        let walletBalance = await walletCredit(
          addMoney,
          user,
          razorpay_order_id
        );
        console.log("wallet balance", walletBalance);
        res.send({ success: true, walletBalance: walletBalance });
      } else {
        console.log("Invalid payment signature");
        res.status(400).json({ message: "Invalid payment signature" });
      }
    } catch (error) {
      console.log("Error processing payment callback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  wallet: async (req, res) => {
    try {
      const addMoney = req.body.addMoney;
      const userId = res.locals.user;
      console.log(addMoney);
      const razorpayOrderOptions = {
        amount: addMoney * 100,
        currency: "INR",
        receipt: "order_rcptid_" + Math.floor(Math.random() * 1000),
      };

      const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
      return res.status(200).json({
        success: true,
        message: "Redirecting to Razorpay for payment",
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
      });
    } catch (error) {
      console.log(error);
    }
  },
  order: async (req, res) => {
    const { selectedAddressId, selectedPaymentOption } = req.body;
    console.log(selectedAddressId, "selectedAddressId");
    const user = res.locals.user;
    if (selectedPaymentOption === "Razorpay") {
      const userCart = await UserCart.findOne({ userId: user });
      if (!userCart) {
        return res.status(404).json({ message: "User cart not found" });
      }
      console.log("usercart end");
      const { totalAmount } = userCart;
      console.log("Razorpay worked");

      const razorpayOrderOptions = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "order_rcptid_" + Math.floor(Math.random() * 1000),
      };

      const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
      console.log("ra", razorpayOrder);

      return res.status(200).json({
        success: true,
        message: "Redirecting to Razorpay for payment",
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
      });
    } else {
      const order_id = await orderPlaced(
        selectedAddressId,
        selectedPaymentOption,
        user
      );
      console.log(order_id, "order id");
      res.status(200).json({
        success: true,
        message: "Order Placed Succesfully",
        order_id: order_id,
      });
    }
  },

  orderPlaced: async (req, res) => {
    try {
      const orderId = req.query.order_id;
      console.log(orderId);

      const userId = res.locals.user;
console.log("userId", userId, "orderID:", orderId);
      const order = await Order.find({ user: userId, _id: orderId });

console.log(order);
      res.render("user/orderPlaced", { order: order });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  orderList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = 6
      const totalOrders = await Order.find({user:res.locals.user}).countDocuments()
      const totalPage = Math.ceil(totalOrders/perPage)

      const orders = await Order.find({ user: res.locals.user })
        .populate("items.product")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage);

      console.log(orders);
      res.render("user/orderList", {
        orders: orders,
        currentPage: page,
        totalPages:totalPage });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  paymentcallback: async (req, res) => {
    const crypto = require("crypto");
    const secret = "Z22hM97tCz6grYcH1sJpXjxG";
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      selectedAddressId,
      selectedPaymentOption,
    } = req.body;
    function generateSignature(order_id, razorpay_payment_id) {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(order_id + "|" + razorpay_payment_id);
      return hmac.digest("hex");
    }
    console.log("razorpay_signature ", razorpay_signature);

    console.log(
      "razorpay_payment_id, razorpay_order_id",
      razorpay_payment_id,
      razorpay_order_id
    );

    try {
      const generatedSignature = generateSignature(
        razorpay_order_id,
        razorpay_payment_id
      );
      console.log(
        "generatedSignature++++razorpay_signature",
        generatedSignature,
        razorpay_signature
      );

      if (generatedSignature === razorpay_signature) {
        console.log("Payment successful");
        const user = res.locals.user;
        const order_id = await orderPlaced(
          selectedAddressId,
          selectedPaymentOption,
          user,
          razorpay_order_id
        );
        res.json({ status: "success", order_id: order_id });
      } else {
        console.log("Invalid payment signature");
        res.status(400).json({ message: "Invalid payment signature" });
      }
    } catch (error) {
      console.log("Error processing payment callback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  orderDetails: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const productId = req.params.productId;
      console.log(productId, orderId);

      const userId = res.locals.user;

      const orderProduct = await Order.findOne({ _id: orderId })
        .populate("items.product")
        .exec();

      const order = await Order.findOne({ _id: orderId }).exec();
      const oneProduct = order.items.find(
        (item) => item.product._id == productId
      );
      console.log(oneProduct);
      console.log(order);
      res.render("user/orderDetails", {
        orders: order,
        orderProduct,
        oneProduct,
      });
    } catch (error) {
      console.log("Order details page error: ", error);
    }
  },

  orderCancel: async (req, res) => {
    try {
      // const { orderId, status, productId } = req.params;
      // console.log("bfdgfdsgfdsg", req.params);
      const { orderId, productId, reason } = req.body;

      console.log("Server reached", reason);
      const order = await Order.findOne({ _id: orderId }).exec();
      const itemToUpdate = order.items.find(
        (item) => item.product.toString() === productId
      );

      // Refund the order amount if payment method is Razorpay
      // if (order.paymentMethod === "Razorpay") {
      //   await refundOrder(order);
      // }
      itemToUpdate.reason = reason;

      itemToUpdate.orderStatus = "OrderCanceled";

      // Save the updated order
      const updatedOrder = await order.save();

      // Update the order status to reflect the cancellation
      // const updatedOrder = await Order.findOneAndUpdate(
      //   { _id: orderId },
      //   { status },
      //   { new: true }
      // );

      res.json({
        message: "Order cancelled successfully",
        order: updatedOrder,
        success: true,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  returnOrder: async (req, res) => {
    try {
      const { orderId, reason, productId } = req.body;
      console.log("worked");

      const order = await Order.findOne({ _id: orderId }).exec();
      const itemToUpdate = order.items.find(
        (item) => item.product.toString() === productId
      );

      itemToUpdate.orderStatus = "Return";

      const updatedOrder = await order.save();

      res.json({
        message: "Return requested",
        order: updatedOrder,
        success: true,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  returnOrder: async (req, res) => {
    try {
      const { orderId, reason, productId } = req.body;
      console.log("worked");

      const order = await Order.findOne({ _id: orderId }).exec();
      const itemToUpdate = order.items.find(
        (item) => item.product.toString() === productId
      );

      itemToUpdate.orderStatus = "Return";

      const updatedOrder = await order.save();

      res.json({
        message: "Return requested",
        order: updatedOrder,
        success: true,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  downloadPdf: async (req, res) => {
    try {
      const orderId = req.query.orderId;

      console.log("orderId", orderId);
      const orderDetails = await Order.findOne({ _id: orderId });
      console.log(orderDetails);
      const filePath = "orderDetails.pdf";

      await generatePDF(orderDetails, filePath);

      res.download(filePath, "orderDetails.pdf", (err) => {
        if (err) {
          console.error("Error sending PDF:", err);
        } else {
          console.log("PDF sent successfully");
        }
      });
    } catch (error) {
      console.log(error);
      res.status(400).send("Sever Error");
    }
  },
};

module.exports = orderController;
