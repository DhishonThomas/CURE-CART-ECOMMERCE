const User = require("../models/user");
const bcrypt = require("bcrypt");
const Product = require("../models/product");
const mongoose = require("mongoose");
const UserCart = require("../models/cartItem");
const userAddress = require("../models/userAddress");
const Order = require("../models/order");
const Razorpay = require("razorpay");
const orderid = require("order-id")("key");

const PDFDocument = require("pdfkit");
const fs = require("fs");


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

    // Refund the amount using Razorpay API
    const refundResponse = await razorpay.refundOrder(
      order.razorpayOrderId,
      totalAmount
    );
    console.log("Razorpay refund response:", refundResponse);

    if (!refundResponse.success) {
      throw new Error("Razorpay refund failed");
    }

    // Update the user's wallet balance
    const userId = order.user;
    const userWallet = await Wallet.findOne({ user: userId }).exec();

    if (!userWallet) {
      throw new Error("User wallet not found");
    }

    userWallet.balance += totalAmount;
    await userWallet.save();
  }
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
    // if (!UserAddress) {
    //   return res.status(404).json({ message: "User address not found" });
    // }

    const address = UserAddress.addresses.find(
      (addr) => addr._id == selectedAddressId
    );

    console.log("Address", address);
    // if (!address) {
    //   return res.status(404).json({ message: "Address not found" });
    // }
    console.log("usercart start");

    const userCart = await UserCart.findOne({ userId: user });
    // if (!userCart) {
    //   return res.status(404).json({ message: "User cart not found" });
    // }
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
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const cartController = require("./cartController");
const razorpay = new Razorpay({
  key_id: "rzp_test_SsymjD3eNkPA50",
  key_secret: "Z22hM97tCz6grYcH1sJpXjxG",
});

const orderController = {
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
      orderPlaced(selectedAddressId, selectedPaymentOption, user);
      res.status(200).json({
        success: true,
        message: "Order Placed Succesfully",
      });
    }
  },

  orderPlaced: async (req, res) => {
    try {
      res.render("user/orderPlaced");
    } catch (error) {
      console.log(error);
    }
  },

  orderList: async (req, res) => {
    try {
      const orders = await Order.find({ user: res.locals.user })
        .populate("items.product")
        .exec();

      console.log(orders);
      res.render("user/orderList", { orders: orders });
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
        orderPlaced(
          selectedAddressId,
          selectedPaymentOption,
          user,
          razorpay_order_id
        );
        res.json({ status: "success" });
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

  downloadPdf:async (req,res) =>{
    try{
        const  orderId = req.query.orderId

        console.log("orderId",orderId);
        const orderDetails = await Order.findOne({_id:orderId})
        console.log(orderDetails);
 const filePath = 'orderDetails.pdf';

 await generatePDF(orderDetails, filePath)
 

  res.download(filePath, 'orderDetails.pdf', (err) => {
    if (err) {
      console.error('Error sending PDF:', err);
    } else {
      console.log('PDF sent successfully');
    }
})

    }catch(error){
        console.log(error);
        res.status(400).send('Sever Error')
    }
  },


};

module.exports = orderController;
