  const User = require("../models/user");
  const bcrypt = require("bcrypt");
  const Userotp = require("../models/userOtp");
  const Product = require("../models/product");
  const mongoose = require("mongoose")

  const userControllers = {
    home: async (req, res) => {
      try {
        const products = await Product.find();
        res.render("user/home", { products });
      } catch (error) {
        console.log(error);
      }
    },

    // <..........................................................................................................>

    signUp: async (req, res) => {
      try {
        res.render("user/signUp");
      } catch (error) {
        console.log(error);
      }
    },
    // <..........................................................................................................>

    signIn: (req, res) => {
      try {
        res.render("user/signUp");
      } catch (error) {
        console.log(error);
      }
    },
    // <..........................................................................................................>

    signUpSignIn: async (req, res, next) => {
      try {
        const { username, email, password, phonenumber, otp } = req.body;
        const userOtp = await Userotp.findOne({ email: email });
        console.log(userOtp);

        if (!userOtp) {
          return res.json({ success: false, message: "Invalid Email" });
        }

        if (parseInt(otp, 10) === userOtp.otp && userOtp.isVerified == true) {
          next();
        } else {
          return res.json({ success: false, message: "Invalid OTP" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          username,
          email,
          password: hashPassword,
          phonenumber,
          isVerified: true,
        });

        if (newUser) {
          await Userotp.deleteOne({ email });
          await newUser.save();
          res.redirect("/");
        }
      } catch (error) {
        console.log(error.message);
      }
    },

    // <..........................................................................................................>

    shop: async (req, res) => {
      const products = await Product.find();
      console.log(products);
      res.render("user/shop", { products });
    },
    // <..........................................................................................................>

    singleProduct: async (req, res) => {
      try {
        const productId = req.params.id;
        console.log("Product ID:", productId);

        // // Check if the productId is a valid ObjectId
        // if (!mongoose.Types.ObjectId.isValid(productId)) {
        //   // If not valid, redirect to the home page or handle it in your own way
        //   console.log("Invalid product ID");
        //   return res.redirect("/");
        // }

        const product = await Product.findOne({ _id: productId });

        if (!product) {
          console.log("Product not found");
          return res.status(404).render("error/404");
        }

        res.render("user/singleProduct", { product });
      } catch (error) {
        console.log(error.message);
        res.status(500).render("error/500");
      }
    },
  };
  module.exports = userControllers;
