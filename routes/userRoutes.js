const express = require('express')
const router = express.Router();
const userAuthMiddileware = require('../app/middilewares/userAuth')
const userControllers = require('../app/controllers/userControllers')
const otpController  = require('../app/controllers/otpControllers')


router.get("/",userControllers.home)

router.get('/signIn',userControllers.signIn)
 
router.post("/signUp",userControllers.signUpSignIn);
 
router.post("/sendOtp", otpController.sendOtp);

router.post("/resendOtp", otpController.sendOtp);

router.post("/verifyOtp",otpController.verifyOtp);

router.get("/shop",userControllers.shop)

router.get("/product/:id", userControllers.singleProduct);


 
module.exports = router
