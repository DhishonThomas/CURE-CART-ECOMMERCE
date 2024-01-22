  const User = require("../models/user");
  const bcrypt = require("bcrypt");
  const Userotp = require("../models/userOtp");
  const Product = require("../models/product");
  const mongoose = require("mongoose");
const cartController = require("./cartController");

  const userControllers = {
    home: async (req, res) => {
      try {
        const user = await User.find();
        const products = await Product.find();
        if (req.session.isUserAuth) {
          console.log("home reached");
          res.render("user/home", { products, user: req.session.isUserAuth });
        } else {
          res.render("user/home", { products, user: null });
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
          // Check if the user is blocked
          if (!user.isBlocked) {
            console.log(user.isBlocked);
            // If blocked, send a message to the user
            return res
              .status(401)
              .send("Your account is blocked. Contact support for assistance.");
          }

          if (await bcrypt.compare(password, user.password)) {
            req.session.isUserAuth = user._id;
            console.log("password is correct", req.session.isUserAuth);
            // res.locals.user = user;

            res.redirect("/");
          } else {
            // Incorrect password
            res.redirect("/signIn");
          }
        } else {
          // No user found
          res.redirect("/signIn");
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

        console.log("useremail", userOtp);

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
      res.locals.user = "";

      req.session.destroy();
      res.redirect("/");
    },
    addToCart: async (req, res) => {
      const { quantity } = req.body;
      const productId = req.params.id;
      const userId = res.locals.user;
      console.log("1 quantity", req.body);
      console.log("2 productid", req.params.id);
      console.log("3 userId", userId);

      try {
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
      } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

      getCart: async (req, res) => {
        // const userId = req.query.userId;
        const userId = res.locals.user
        console.log(userId);
        try {
          const result = await cartController.getCart({ userId });
          // res.json(result);

          if(result){
            res.render("user/cart")
          }
        } catch (error) {
          console.log(error);
        }
      },
    updateQuantity: async (req,res)=>{
      const {userId,productId,quantity} = req.body
      try {
        const result = await cartController.updateQuantity({
          userId,
          productId,
          quantity,
        });
      } catch (error) {
        console.log(error)

      }

    },
    removeFromCart: async(req,res)=>{
      const {userId,productId} = req.body

      try{
        const result = await cartController.removeFromCart({userId,productId})
        res.json(result)
      }catch(error){
        console.log(error);
      }
    }

  };
  module.exports = userControllers;
