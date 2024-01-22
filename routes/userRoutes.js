const express = require('express')
const router = express.Router();
const userAuthMiddleware = require("../app/middilewares/userAuth");
const userControllers = require('../app/controllers/userControllers')
const otpController  = require('../app/controllers/otpControllers')
const checkUserBlocked = require("../app/middilewares/checkUserBlock");
const cartController = require('../app/controllers/cartController');
router.use(userAuthMiddleware);
router.use("/", checkUserBlocked); 
router.use("/signIn", checkUserBlocked);
router.use("/signUp", checkUserBlocked);
router.use("/shop", checkUserBlocked);
router.use("/logout", checkUserBlocked);
router.use("/product/:id",checkUserBlocked);



router.get("/", userControllers.home);

router.get("/signIn",userControllers.signIn);

router.post("/signIn", userControllers.signInAuth);

router.get("/signUp", userControllers.signUp);
 
router.post("/signUp", userControllers.signUpSignIn);
 
router.post("/sendOtp",otpController.sendOtp);

router.post("/resendOtp", otpController.sendOtp);

router.post("/verifyOtp", otpController.verifyOtp);

router.get("/shop",userControllers.shop);

router.get("/product/:id",userControllers.singleProduct);

router.get("/logout",userControllers.logout);
 
router.post("/add-to-cart/:id",userControllers.addToCart);

router.get("/cart",userControllers.getCart)

router.patch("/update-quantity", userControllers.updateQuantity);

router.delete("/remove-from-cart", userControllers.removeFromCart);

module.exports = router
