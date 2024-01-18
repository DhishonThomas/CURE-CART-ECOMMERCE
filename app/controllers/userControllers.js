  const User = require("../models/user");
  const bcrypt = require("bcrypt");
  const Userotp = require("../models/userOtp");
  const Product = require("../models/product");
  const mongoose = require("mongoose")

  const userControllers = {
    home: async (req, res) => {
      try {
        const user = await User.find();
        const products = await Product.find();
        if (req.session.isUserAuth) {
          res.render("user/home", { products, user: true });
        } else {
          res.render("user/home", { products, user: false });
        }
        //  res.render("user/home", { products, user});
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
        res.render("user/signIn");
      } catch (error) {
        console.log(error);
      }
    },

    signInAuth: async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
          req.session.isUserAuth = true;
          console.log(req.session.isUserAuth);
          res.locals.user= user
          res.redirect("/");
        } else {
          res.redirect("/signIn");
        }
      } catch (error) {
        console.log("error in user login", error);
        res.redirect("/signIn");
      }
    },
    // <..........................................................................................................>

    signUpSignIn: async (req, res, next) => {
      try {
        const { username, email, password, phonenumber, otp } = req.body;
        console.log(req.body);
        const userOtp = await Userotp.findOne({ email: email });

        console.log("useremail", userOtp);

        if (!userOtp) {
          return res.json({ success: false, message: "Invalid Email" });
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
          return res.json({ success: false, message: "Invalid OTP" });
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
    logout: (req, res) => {
      // req.session.isAuthenticated = false;
      res.locals.user = '';

      req.session.destroy()
        res.redirect("/");
      
    },
  };
  module.exports = userControllers;
