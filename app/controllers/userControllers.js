const User = require("../models/user");
const bcrypt = require("bcrypt");
const Userotp = require("../models/userOtp");
const Product = require("../models/product");
const mongoose = require("mongoose");
const UserCart = require("../models/cartItem");
const userAddress = require("../models/userAddress");
const Wallet = require("../models/wallet");
const cartController = require("./cartController");
const Wishlist = require("../models/wishlist");
const { wallet } = require("./orderController");
const Coupon = require("../models/coupon");
const CouponUsage = require("../models/userCoupon");
const Offer = require("../models/offer");
const userControllers = {
  home: async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(res.locals.user);
      const user = await User.findOne(userId);
     
const aurevedic=await Product.aggregate([
  {
    $lookup:{
      from:"categories",
      localField:"category",
      foreignField:"_id",
      as:"categoryDetails"
    }
  },
  {
    $match:{
      "categoryDetails.category_name":"Aurvedic"
    }
  },
  {
    $unwind:"$categoryDetails"
  }
])

     const allopathic=await Product.aggregate([
      {
        $lookup:{
          from:"categories",
          localField:"category",
          foreignField:"_id",
          as:"categoryDetails"
        },
      },
      {
        $match:{
          "categoryDetails.category_name":"Allopathic"
        },
      },
      {
        $unwind:"$categoryDetails"
      }
     ])

     const homeopathic=await Product.aggregate([
      {
        $lookup:{
          from:'categories',
          localField:'category',
          foreignField:'_id',
          as:"categoryDetails"
        },
      },
      {
        $match:{
          "categoryDetails.category_name":"Homeopathy"
        }
      },
      {
        $unwind:"$categoryDetails"
      }
     ])

      const cartItems = await UserCart.findOne(userId).populate(
        "cartItems.productId"
      );
      if (req.session.isUserAuth) {
        res.render("user/home", {
          homeopathic,allopathic,aurevedic,
          user: req.session.isUserAuth,
          cartItems,
          user,
        });
      } else {
        res.render("user/home", { homeopathic,allopathic,aurevedic, user: null });
      }
      //  res.render("user/home", { products, user});
    } catch (error) {
      console.log(error);
    }
  },

  // <..........................................................................................................>

  signUp: async (req, res) => {
    try {
      res.render("user/signUp", { message: "" });
    } catch (error) {
      console.log(error);
    }
  },
  // <..........................................................................................................>

  signIn: (req, res) => {
    try {
      if (req.session.isUserAuth) {
        res.redirect("/");
      } else {
        res.render("user/signIn");
      }
    } catch (error) {
      console.log(error);
    }
  },

  signInAuth: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (user) {
        if (!user.isBlocked) {
          return res.json({ data: false, error: "User is blocked" });
        }

        if (await bcrypt.compare(password, user.password)) {
          req.session.isUserAuth = user._id;
          res.json({ data: true });
        } else {
          res.json({
            data: false,
            error: "Invalid email or password",
          });
        }
      } else {
        return res.json({ data: false, error: "Invalid email or password" });
      }
    } catch (error) {
      console.error("Error in user login", error);
      res.redirect("/signIn");
    }
  },

  // <..........................................................................................................>

  signUpSignIn: async (req, res, next) => {
    try {
      const { username, email, password, phonenumber, otp } = req.body;
      console.log(req.body);
      const userOtp = await Userotp.findOne({ email: email });


      if (!userOtp) {
        return res.render("user/signUp", {
          message: "Submit the verified email",
        });
      }

      if (parseInt(otp, 10) === userOtp.otp && userOtp.isVerified == true) {
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          username,
          email,
          password: hashPassword,
          phonenumber,
          isVerified: true,
        });

        if (newUser) {
          await Userotp.deleteOne({ email: email });
          await newUser.save();
          res.redirect("/signIn");
        } else {
          return res.json({
            success: false,
            message: "User creation failed",
          });
        }
      } else {
        return res.render("user/signUp", {
          message: "Submit the verified opt",
        });
      }
    } catch (error) {
      console.error(error.message);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // <..........................................................................................................>

  shop: async (req, res) => {
    try {

      const page = parseInt(req.query.page) || 1;
      const perPage = 6;

      let query = { isListed: true };

      if (req.query.category) {
        query.category = req.query.category;

        const totalProducts = await Product.countDocuments({
          category: query.category,
        });

        const totalPages = Math.ceil(totalProducts / perPage);

        const products = await Product.find({ category: query.category })
          .populate({
            path: "category",
            populate: {
              path: "offer",
            },
          }) 
          .populate("offer")
          .skip((page - 1) * perPage)
          .limit(perPage);

        res.render("user/shop", {
          products,
          totalPages,
          currentPage: page,
        });
      }  else if (req.body.search) { 
        const searchQuery = req.body.search; 
        console.log("gfugfudsguysfdgjhdsgudsydsfhjb",searchQuery);

        const totalProducts = await Product.countDocuments({ productName: { $regex: '^' + searchQuery, $options: 'i' } });

        const totalPages = Math.ceil(totalProducts / perPage);

        const products = await Product.find({ productName: { $regex: '^' + searchQuery, $options: 'i' } })
            .populate({
                path: "category",
                populate: {
                    path: "offer",
                },
            })
            .populate("offer")
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.render("user/shop", {
            products,
            totalPages,
            currentPage: page,
        });
    }
      else{
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / perPage);

        const products = await Product.find(query)
          .populate({
            path: "category",
            populate: {
              path: "offer",
            },
          })
          .populate("offer")
          .skip((page - 1) * perPage);

        res.render("user/shop", { products, totalPages, currentPage: page });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  // <..........................................................................................................>

  contact:async(req,res)=>{

    try {
      return res.render("user/contactAs");

    } catch (error) {
      console.log(error.message);
      res.status(500).render("error/500");
      
    }
  },

  singleProduct: async (req, res) => {
    try {
      const productId = req.params.id;
      console.log("Product ID:", productId);
      const userId = res.locals.user;
      const product = await Product.findOne({ _id: productId })
      .populate({
        path: "category",
        populate: {
          path: "offer",
        },
      })
      .populate("offer")

      const cart = await UserCart.findOne({ userId: userId }).exec();
      console.log(cart);

      const foundProduct = cart
        ? cart.cartItems.find((item) => item.productId == productId)
        : null;
      console.log("foundProduct", foundProduct);
      if (foundProduct == null) {
        return res.render("user/singleProduct", { product, foundProduct: "" });
      }
      if (!product) {
        console.log("Product not found");
        return res.status(404).render("error/404");
      }

      res.render("user/singleProduct", { product, foundProduct });
    } catch (error) {
      console.log(error.message);
      res.status(500).render("error/500");
    }
  },
  logout: (req, res) => {
    // req.session.isAuthenticated = false;
    res.locals.user = "";

    req.session.destroy();
    res.redirect("/");
  },
  addToCart: async (req, res) => {
    const { quantity } = req.body;

    const productId = req.params.id;
    const userId = res.locals.user;

    try {
      if (req.session.isUserAuth) {
        console.log("worked");
        const result = await cartController.addToCart(
          userId,
          productId,
          quantity
        );
        if (result) {
          res.status(200).json({ message: "Item added to cart successfully" });
        } else {
          res.status(500).json({ error: "Error adding item to cart" });
        }
      } else {
        res.json({ success: false });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getCart: async (req, res) => {
    // const userId = req.query.userId;
    console.log("getCART wORKED");
    const userId = res.locals.user;
    console.log("userId", userId);

    try {
      const result = await cartController.getCart(userId);

      console.log(result);

      if (result && result.cartItems) {
        const cartItems = result.cartItems;
        const cartTotal = result.userCart;
        console.log("cartTotal:", cartTotal);

        const product = await Product.find()

        res.render("user/cart", {
          cartItems,
          product,
          productTitle: cartItems.productId,
          cartTotal,
        });
      }
    } catch (error) {
      console.log(error);
    }
  },

  updateQuantity: async (req, res) => {
    const { quantity, itemId, userId } = req.body;

    const userCart = await UserCart.findById(userId).populate(
      "cartItems.productId"
    );
    console.log("userCart", userCart);

    try {
      const result = await cartController.updateQuantity(
        userId,
        itemId,
        quantity
      );
      console.log("Result After the updation", result);

      console.log("itemTotals", result.itemTotals);
      if (result.success) {
        res.json({
          success: true,
          total: result.total,
          itemTotals: result.itemTotals,
        });
      } else {
        res.json({ success: false, total: result.total });
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "internal server error" });
    }
  },

  removeFromCart: async (req, res) => {
    console.log("Route is hit!");

    const { cartItemId } = req.params;

    console.log("cartItemId", cartItemId);

    try {
      const cartItemObjectId = new mongoose.Types.ObjectId(cartItemId);

      console.log("removeFromCart function called");
      const user = new mongoose.Types.ObjectId(res.locals.user);
      console.log("User res", user);
      const result = await cartController.removeFromCart(
        user,
        cartItemObjectId
      );

      if (result) {
        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "Error removing item from cart",
        });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  checkOut: async (req, res) => {
    try {
      const userId = res.locals.user;

      const RazUser = await User.findById(userId);

      let userAddresses = await userAddress.findOne({ userId: userId });

      // console.log("userAddress::", userAddresses);
      const wallet = await Wallet.findOne({ user: userId });
      const result = await cartController.getCart(userId);

      const availableCoupons = await Coupon.find({
        validUntil: { $gte: new Date() },
        maxUsageCount: { $gt: 0 },
        isListed: true,
      });


      const unusedCoupons = [];

      for (const coupon of availableCoupons) {
        const usageCount = await CouponUsage.countDocuments({
          coupon: coupon._id,
        });
        if (usageCount < coupon.maxUsageCount) {
          unusedCoupons.push(coupon);
        }
      }


      if (result && result.cartItems) {
        const cartItems = result.cartItems;
        const cartTotal = result.userCart;


        const product = await Product.find();
        res.render("user/checkOut", {
          userAddress: userAddresses ? userAddresses.addresses : null,
          cartItems,
          cartTotal,
          RazUser,
          wallet,
          coupons: unusedCoupons,
        });
        // res.render("user/cart", {
        //   cartItems,
        //   product,
        //   productTitle: cartItems.productId,
        //   cartTotal,
        // });
      }
    } catch (error) {
      console.log(error);
    }
  },

  profile: async (req, res) => {
    const userId = new mongoose.Types.ObjectId(res.locals.user);
    const user = await User.findOne({ _id: userId });
    const userAddresses = await userAddress.findOne({ userId: userId });
    const RazUser = await User.findById(userId);

    let Wallets = await Wallet.findOne({ user: userId });

    console.log("wihishfjuiasfhduifhdsiudsafh", Wallets);
    let addresses = []; 
    if (userAddresses && userAddresses.addresses) {
      addresses = userAddresses.addresses;
    }

    res.render("user/userProfile", {
      user: user,
      addresses: addresses,
      RazUser,
      Wallets,
    });
  },

  address: async (req, res) => {
    let { name, mobile, address, pinCode, street, city, state } = req.body;

    try {
      name = name.trim();
      mobile = mobile.trim();

      if (!name || !mobile || !address || !pinCode || !city || !state) {
        return res.redirect("/profile?err=emptyfields");
      }

      const userId = new mongoose.Types.ObjectId(res.locals.user);
      const userData = await userAddress.findOne({ userId });

      if (!userData) {
        const newUserAddress = new userAddress({
          userId: userId,
          addresses: [{ name, mobile, address, pinCode, street, city, state }],
        });
        await newUserAddress.save();
      } else {
        userData.addresses.push({
          name,
          mobile,
          address,
          pinCode,
          street,
          city,
          state,
        });
        await userData.save();
      }

      res.redirect("/profile#tab-address");
    } catch (error) {
      console.error("Error saving address:", error);
      res.status(500).send("Error saving address");
    }
  },

  addressDelete: async (req, res) => {
    try {
      const userId = res.locals.user;
      const deletedData = await userAddress.findOneAndUpdate(
        { userId: userId },
        { $pull: { addresses: { _id: req.params.id } } },
        { new: true }
      );
      console.log("dataDeleted===>>>", deletedData);
      res.redirect(req.headers.referer);
    } catch (error) {
      console.log(error);
    }
  },

  addressEdit: async (req, res) => {
    let addressId = req.params.id;
    try {
      console.log(addressId);
      const { name, mobile, address, pinCode, street, city, state } = req.body;
      console.log(req.body);
      const userId = res.locals.user;
      const userAddresses = await userAddress.findOne({ userId: userId });
      console.log(userAddresses);
      if (!userAddresses) {
        return res.status(401).json({ message: "No User Address Found" });
      }
      console.log("worked");
      const addressIndex = userAddresses.addresses.findIndex(
        (address) => address._id.toString() == addressId
      );
      console.log(addressIndex);
      if (addressIndex == -1) {
        return res.status(401).json({ message: "No User Address Found" });
      }
      userAddresses.addresses[addressIndex].name = name;
      userAddresses.addresses[addressIndex].mobile = mobile;
      userAddresses.addresses[addressIndex].address = address;
      userAddresses.addresses[addressIndex].pinCode = pinCode;
      userAddresses.addresses[addressIndex].street = street;
      userAddresses.addresses[addressIndex].city = city;
      userAddresses.addresses[addressIndex].state = state;
      await userAddresses.save();
      res.redirect("/profile");
    } catch (error) {
      console.log("Errror Updating", error);
    }
  },
  updateuserProfile: async (req, res) => {
    const { username, email, phonenumber } = req.body;
    console.log(req.body);
    try {
      const userId = res.locals.user;
      const user = await User.findOne({ _id: userId });
      console.log(user);
      if (!user) {
        throw new Error("User Not   Found");
      }
      const data = await User.findByIdAndUpdate(userId, {
        username,
        phonenumber,
      });
      console.log("data", data);
      res.json({ data: true });
    } catch (error) {
      console.log(error);
    }
  },

  changepassword: async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    console.log(req.body);
    try {
      const userId = res.locals.user;
      const user = await User.findOne({ _id: userId });

      if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
        res.json({ data: false, message: "Incorrect current password." });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          error: false,
          message: "New password and confirm password do not match.",
        });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      console.log("pasword is saved");
      res
        .status(200)
        .json({ data: true, message: "Password changed successfully." });
    } catch (error) {
      console.log(error);
    }
  },
  adderesAddChekOut: async (req, res) => {
    console.log("reqBody", req.body);
    var { name, mobile, address, pinCode, city, state, street } = req.body;
    try {
      name = name.trim();
      mobile = mobile.trim();
      console.log("ecoceco");
      if (
        !name ||
        !mobile ||
        !address ||
        !pinCode ||
        !city ||
        !state ||
        !street
      ) {
        return res.json({ data: false });
      }
      const userId = new mongoose.Types.ObjectId(res.locals.user);
      console.log("userData start");

      const userData = await userAddress.findOne({ userId });
      console.log("userData end");

      if (!userData) {
        const newUserAddress = new userAddress({
          userId: userId,
          addresses: [
            { name, mobile, address, pinCode, street, city, state, street },
          ],
        });
        await newUserAddress.save();
      } else {
        userData.addresses.push({
          name,
          mobile,
          address,
          pinCode,
          street,
          city,
          state,
          street,
        });
        await userData.save();
      }
      res.json({ data: true });
    } catch (error) {
      console.log(error);
    }
  },

  search:async(req,res)=>{
    const searchQuery = req.query.search;
    console.log("log worked",searchQuery);
    Product.find({ $text: { $search: searchQuery } })
        .then(products => {
            res.json({ products });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    },

 
  
};
module.exports = userControllers;
 