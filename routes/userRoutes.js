const express = require('express')
const router = express.Router();
const userAuthMiddleware = require("../app/middilewares/userAuth");
const userControllers = require('../app/controllers/userControllers')
const otpController  = require('../app/controllers/otpControllers')
router.use(userAuthMiddleware);


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
 
module.exports = router
