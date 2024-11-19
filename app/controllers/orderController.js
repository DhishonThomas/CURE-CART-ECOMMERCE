const User = require("../models/user");
const Product = require("../models/product");
const UserCart = require("../models/cartItem");
const userAddress = require("../models/userAddress");
const Order = require("../models/order");
const Razorpay = require("razorpay");
const orderid = require("order-id")("key");
const Wallet = require("../models/wallet")
const Transaction = require("../models/transaction")
const PDFDocument = require("pdfkit");
const fs = require("fs");

const  Coupon = require("../models/coupon")
const CouponUsage = require("../models/userCoupon")
 
const cron = require('node-cron')


async function retryOrder(user,razorpay_order_id,orderedId,selectedPaymentOption){
  try{
const order = await Order.findOne({user:user,_id:orderedId})


console.log("retry order function order::",order);
if(order){
  let paymentOption
  if(selectedPaymentOption==="RazorpayFailed"){
    paymentOption="Failed"
  }else if(selectedPaymentOption==="Razorpay"){
    paymentOption="Completed"

  }

  order.paymentStatus = paymentOption
  order.paymentMethod = selectedPaymentOption;
  order.razorpayOrderId = razorpay_order_id
  console.log("order.paymentStatus",order.paymentStatus);
  console.log("order.paymentMethod",order.paymentMethod);
 let order_id=order._id

  await order.save();
  console.log("order after save",order);

  return order_id
}


  }catch(error){
console.log(error);
  }
}

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
  orderDetails.items.forEach((item) => {
    doc.text(`Product: ${item.product}`).moveDown();
    doc.text(`Product Name: ${item.productName}`).moveDown();
    doc.text(`Quantity: ${item.quantity}`).moveDown();
    doc.text(`Price: ${item.price}`).moveDown();
    doc.text(`Total: ${item.total}`).moveDown();
  });

  doc.text(`Total Amount: ${orderDetails.totalAmount}`).moveDown();

  doc.end();
}

module.exports = generatePDF;


const razorpay = new Razorpay({
  key_id: "rzp_test_SsymjD3eNkPA50",
  key_secret: "Z22hM97tCz6grYcH1sJpXjxG",
});


async function refundOrder(order) {
  try{
const totalAmount = order.totalAmount;

const userId = order.user;
const userWallet = await Wallet.findOne({ user: userId }).exec();

if (!userWallet) {
  throw new Error("User wallet not found");
}

userWallet.balance += totalAmount;
await userWallet.save();
  }catch(error){
console.log(error);
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

 wallet.balance += addMoneyNumber;
 await transaction.save()
let walletBalance = wallet.balance;
 await wallet.save()
 
 return walletBalance;



          }

async function orderPlaced(
  selectedAddressId,
  selectedPaymentOption,
  user,
  razorpay_order_id,
  
) {
  try {
  

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

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const userCart = await UserCart.findOne({ userId: user });
    if (!userCart) {
      return res.status(404).json({ message: "User cart not found" });
    }
    const { totalAmount } = userCart;
    const cartItems = userCart.cartItems;

    const orderItems = await Promise.all(
      cartItems.map(async (cartItem) => {
        const product = await Product.findById(cartItem.productId).exec();
        if (!product) {
          throw new Error("Product not found");
        }
        return {
          product: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.price,
        };
      })
    );
    let paymentOption
    if(selectedPaymentOption==="RazorpayFailed"){
      paymentOption="Failed"
    }else if(selectedPaymentOption==="Razorpay"){
      paymentOption="Completed"

    }else if(selectedPaymentOption==="cash"){
      paymentOption="Pending"

    }


    const orderId = orderid.generate();
    const order = new Order({
      orderId: orderId,
      user: user,
      items: orderItems,
      totalAmount: totalAmount,
      shippingAddress: address,
      paymentMethod: selectedPaymentOption,
      razorpayOrderId: razorpay_order_id,
      paymentStatus:paymentOption
        });

    await order.save();
  
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
    userCart.cartItems = [];
    userCart.totalAmount = 0;
    await userCart.save();
    return order._id
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

  const orderController = {
    orderRetry: async (req, res) => {
      try {
        const userId = res.locals.user;
        const { orderId, selectedPaymentOption } = req.body;
        console.log(userId, orderId);

        const order = await Order.findOne({ user: userId, _id: orderId });
        console.log("order",order);
        if (!order) {
          return res.status(404).json({ success: false, message: "Order not found" });
        } 
    
        const { totalAmount, _id } = order;
    
        const razorpayOrderOptions = {
          amount: totalAmount*100,
          currency: "INR", 
          receipt: "order_rcptid_" + Math.floor(Math.random() * 1000),
        };
    
        const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
        console.log("razorpayOrder worked",razorpayOrder);
        return res.status(200).json({
          success: true,
          message: "Redirecting to Razorpay for payment",
          orderIdRaz: razorpayOrder.id,
          amount: razorpayOrder.amount,
          orderedId: _id,
          selectedPaymentOption
        });
    
      } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
      }
    },
    
  retryCallback:async(req,res)=>{
    const crypto = require("crypto");
    const secret = "Z22hM97tCz6grYcH1sJpXjxG";
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderedId,
      selectedPaymentOption
      } = req.body;
    function generateSignature(order_id, razorpay_payment_id) {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(order_id + "|" + razorpay_payment_id);
      return hmac.digest("hex");
    }


    try {
      console.log("retryCallback worked");
      const order = await Order.findOne({razorpayOrderId:razorpay_order_id})
      console.log("order:",order);
      if(order){
        order.paymentStatus = "Completed";
        order.paymentMethod = selectedPaymentOption;
        console.log("order.paymentStatus",order.paymentStatus);
        console.log("order.paymentMethod",order.paymentMethod);
       let order_id=order._id
      
        await order.save();
        console.log("order after save",order);
      
        return res.json({success:true,message:"Payment Successfull",order_id:order_id})
      }
      
      const generatedSignature = generateSignature(
        razorpay_order_id,
        razorpay_payment_id
      );

      if (generatedSignature === razorpay_signature) {
        console.log("Payment successful");
        const user = res.locals.user;
        let updatedOrder = await retryOrder(
          user,
          razorpay_order_id,
          orderedId,
          selectedPaymentOption
        );
        res.json({ success: true, updatedOrder: updatedOrder });
      } else {
        console.log("Invalid payment signature");
        res.status(400).json({ message: "Invalid payment signature" });
      }
    } catch (error) {
      console.log("Error processing payment callback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
    retryOrder:async(req,res)=>{

    try{
      let {razorpay_order_id,selectedPaymentOption}=req.body

      selectedPaymentOption="RazorpayFailed"
      let user = res.locals.user

      const order_id = await retryOrder(
        razorpay_order_id,
        selectedPaymentOption
      );

      res.status(200).json({
        success: true,
        message: "Order Placed Succesfully",
        order_id:order_id
      });
    

    }catch(error){
      console.log(error);
    }
  },


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


    try {
      const generatedSignature = generateSignature(
        razorpay_order_id,
        razorpay_payment_id
      );
   
      if (generatedSignature === razorpay_signature) {
        console.log("Payment successful");
        const user = res.locals.user;
        let walletBalance = await walletCredit(
          addMoney,
          user,
          razorpay_order_id
        );
        res.send({ success: true, walletBalance: walletBalance });
      } else {
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
  retryOrderCheckout:async(req,res)=>{
    try{
      let {couponCode,totalAmountCoupon,razorpay_order_id,selectedAddressId,selectedPaymentOption}=req.body
      selectedPaymentOption="RazorpayFailed"
      let user = res.locals.user
      const order_id = await orderPlaced(
        selectedAddressId,
        selectedPaymentOption,
        user,
        razorpay_order_id,
      );
      res.status(200).json({
        success: true,
        message: "Order Pending",
        order_id:order_id
      });

    }catch(error){
      console.log(error);
    }
  },
  order: async (req, res) => {
    const {
      selectedAddressId,
      selectedPaymentOption,
      totalAmountCoupon,
      couponCode,
    } = req.body;
    
    const user = res.locals.user;
          const userCart = await UserCart.findOne({ userId: user });
////////////////////////////////////////////////////////////////////////////////////
    if (selectedPaymentOption === "Razorpay") {
      if (!userCart) {
        return res.status(404).json({ message: "User cart not found" });
      }
   

      const razorpayOrderOptions = {
        amount: totalAmountCoupon * 100,
        currency: "INR",
        receipt: "order_rcptid_" + Math.floor(Math.random() * 1000),
      };

      const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

      return res.status(200).json({
        success: true,
        message: "Redirecting to Razorpay for payment",
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        couponCode:couponCode
      });
    }  
    //////////////////////////////////////////////////////////////////////
    else {
      const userWallet = await Wallet.findOne({ user: user }).exec();
      const walletBalance = userWallet ? userWallet.balance : 0;
    
     if (selectedPaymentOption === "wallet" && walletBalance >= totalAmountCoupon) {
      userWallet.balance -= totalAmountCoupon;
      await userWallet.save();
    } else if (selectedPaymentOption === "wallet" && walletBalance < totalAmountCoupon) {
      return res.status(400).json({ message: "Insufficient wallet balance", wallet:true});
    }
      const order_id = await orderPlaced(
        selectedAddressId,
        selectedPaymentOption,
        user,
        totalAmountCoupon,
        couponCode
      );

      if(order_id){
        if(couponCode){
          const coupon = await Coupon.findOne({
            code: couponCode,
            validUntil: { $gte: new Date() },
          });
          const newUsage = new CouponUsage({
            coupon: coupon._id,
            user:user,
          });
        
          userCart.totalAmount = totalAmountCoupon;
        
          await newUsage.save();
        }
      }
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

      const userId = res.locals.user;
      const order = await Order.find({ user: userId, _id: orderId });

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
      couponCode,
      totalAmountCoupon

    } = req.body;
    function generateSignature(order_id, razorpay_payment_id) {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(order_id + "|" + razorpay_payment_id);
      return hmac.digest("hex");
    }


    try {

const order = await Order.findOne({razorpayOrderId:razorpay_order_id})
console.log("order:",order);
if(order){

  order.paymentStatus = "Completed";
  order.paymentMethod = selectedPaymentOption;
  console.log("order.paymentStatus",order.paymentStatus);
  console.log("order.paymentMethod",order.paymentMethod);
 let order_id=order._id

  await order.save();
  console.log("order after save",order);

  return res.json({success:true,message:"Payment Successfull",order_id:order_id})
}

      const generatedSignature = generateSignature(
        razorpay_order_id,
        razorpay_payment_id
      );
     

      if (generatedSignature === razorpay_signature) {
        const user = res.locals.user;
        const order_id = await orderPlaced(
          selectedAddressId,
          selectedPaymentOption, 
          user,
          razorpay_order_id,
          razorpay_payment_id,
        );
        if(order_id){
          if(couponCode){
            const userCart = await UserCart.findOne({ userId: user });
            const coupon = await Coupon.findOne({
              code: couponCode,
              validUntil: { $gte: new Date() },
            });
            const newUsage = new CouponUsage({
              coupon: coupon._id,
              user:user,
            }); 

            userCart.totalAmount = totalAmountCoupon;
          
            await newUsage.save();
          }
        }
        console.log("Payment call back worked");
        res.json({ status: "success", order_id: order_id });
      } else {
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

      const userId = res.locals.user;
      const RazUser = await User.findById(userId);

      const orderProduct = await Order.findOne({ _id: orderId })
        .populate("items.product")
        .exec();

      const order = await Order.findOne({ _id: orderId }).exec();
      const oneProduct = order.items.find(
        (item) => item.product._id == productId
      );
      
      res.render("user/orderDetails", {
        orders: order,
        orderProduct,
        oneProduct,
        RazUser
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

      const order = await Order.findOne({ _id: orderId }).exec();
      const itemToUpdate = order.items.find(
        (item) => item.product.toString() === productId
      );

      if (order.paymentMethod === "Razorpay") {

        await refundOrder(order);
      }data
      itemToUpdate.reason = reason;

      itemToUpdate.orderStatus = "OrderCanceled";

      const updatedOrder = await order.save();

      // const updatedOrder = await Order.finddataOneAndUpdate(
      //   { _id: orderId },
      //   { status },
      //   { new: true }
      // );

      res.json({
        message: "Order cancelled successfully",
        order: updatedOrder,
        success: true,
        RazUser
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  returnOrder: async (req, res) => {
    try {
      const { orderId, reason, productId } = req.body;

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

      const orderDetails = await Order.findOne({ _id: orderId });
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
