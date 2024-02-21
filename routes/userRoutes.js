const express = require("express");
const router = express.Router();
const userAuthMiddleware = require("../app/middilewares/userAuth");
const userControllers = require("../app/controllers/userControllers");
const otpController = require("../app/controllers/otpControllers");
const checkUserBlocked = require("../app/middilewares/checkUserBlock");
const resetPasswordController = require("../app/controllers/resetPasswordController");
const wishListController = require("../app/controllers/wishlistController");
const orderController = require("../app/controllers/orderController");

router.use(userAuthMiddleware);
router.use("/", checkUserBlocked);
router.use("/signIn", checkUserBlocked);
router.use("/signUp", checkUserBlocked);
router.use("/shop", checkUserBlocked);
router.use("/logout", checkUserBlocked);
router.use("/product/:id", checkUserBlocked);

router.get("/", userControllers.home);

router.get("/signIn", userControllers.signIn);

router.post("/signIn", userControllers.signInAuth);

router.get("/signUp", userControllers.signUp);

router.post("/signUp", userControllers.signUpSignIn);

//////////////////////////////////////////////////////////////////////////////

router.post("/sendOtp", otpController.sendOtp);

router.post("/resendOtp", otpController.sendOtp);

router.post("/verifyOtp", otpController.verifyOtp);

//////////////////////////////////////////////////////////////////////////////

router.get("/shop", userControllers.shop);

router.get("/product/:id", userControllers.singleProduct);

router.get("/logout", userControllers.logout);

router.post("/add-to-cart/:id", userControllers.addToCart);

router.get("/cart", userControllers.getCart);

router.patch("/update-quantity", userControllers.updateQuantity);

router.delete("/remove-from-cart/:cartItemId", userControllers.removeFromCart);

router.get("/checkOut", userControllers.checkOut);

router.get("/profile", userControllers.profile);

router.post("/address", userControllers.address);

router.get("/addressDelete/:id", userControllers.addressDelete);

router.post("/addressEdit/:id", userControllers.addressEdit);

//////////////////////////////////////////////////////////////////////////////

router.get("/forget-password", resetPasswordController.forgetEmail);

router.post("/forget-password", resetPasswordController.forgetPassword);

router.get("/reset/:token", resetPasswordController.reset);

router.post("/reset-password/:token", resetPasswordController.resetPassword);

//////////////////////////////////////////////////////////////////////////////

router.post("/update-userProfile", userControllers.updateuserProfile);

router.post("/changepassword", userControllers.changepassword);

router.post("/adderesAddChekOut", userControllers.adderesAddChekOut);

////////////////////////////////////////////////////////////////////////

router.post("/orders", orderController.order);

router.get("/orderPlaced", orderController.orderPlaced);

router.get("/order-list", orderController.orderList);

router.get("/order-details/:orderId/:productId", orderController.orderDetails);

router.post("/cancel-order", orderController.orderCancel);

router.post("/payment-callback", orderController.paymentcallback);

router.post("/return-order", orderController.returnOrder);

router.get("/download-pdf", orderController.downloadPdf);
/////////////////////////////////////////////////////////////////////////////////////

router.get("/wishList", wishListController.wishlist);

router.post("/wishListAdd", wishListController.wishlistAdd);

router.delete("/wishlistRemove/:productId", wishListController.wishlistRemove);

module.exports = router;
