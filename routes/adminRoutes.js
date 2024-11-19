// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../app/controllers/adminController");
const couponController = require("../app/controllers/couponController")
const adminAuthMiddileware = require("../app/middilewares/adminAuth");
const path = require('path')
const adminDashboardController = require("../app/controllers/adminDashboardController")
const adminOrderController = require("../app/controllers/adminOrderController");
const offerControllers = require("../app/controllers/offerControllers")
router.get("/admin", adminAuthMiddileware,adminController.admin);

router.get("/usersList", adminAuthMiddileware, adminController.usersList);

router.put("/userUlist/:id", adminAuthMiddileware, adminController.userUlist);

// Admin sign-in route
router.post("/signin", adminController.signIn);

// Admin Logout

router.get("/adminLogout", adminAuthMiddileware,adminController.logout);

// Admin Dashboard
router.get("/dashboard", adminAuthMiddileware,adminController.adminDashboard);

// Product management routes
// router.post("/addProduct", adminController.addProduct);

//Product Creation routes
router.get("/createProduct",adminAuthMiddileware, adminController.addProduct)

router.post("/createProduct", adminController.createProduct);

router.get("/newCategory", adminAuthMiddileware,adminController.createCategory);

router.post("/newCategory",adminController.newCategory); 

router.get("/categoryList", adminAuthMiddileware,adminController.categoryList);

router.get(
  "/categoryDelete/:id",
  adminAuthMiddileware,adminController.categoryDelete
);

router.get(
  "/categoryEdit/:id",
  adminAuthMiddileware,adminController.categoryEdit
);

router.post("/categoryEdit/:id", adminController.categoryEditUpdate);

router.get("/categoryUlist/:id",adminAuthMiddileware, adminController.categoryUlist);

router.get("/productList",adminAuthMiddileware, adminController.productList);

router.get("/productCategory/:id",adminAuthMiddileware, adminController.productCategory);

router.get("/productListEdit/:id",adminAuthMiddileware, adminController.productListEdit);

router.post("/productListEdit/:id",adminController.productListEditUpdate)

router.delete(
  "/productListEdit/:productId/images/:imageIndex",
 adminAuthMiddileware, adminController.productEditDeleteImage
);

router.get("/productListDelete/:id",adminAuthMiddileware, adminController.productListDelete);

router.get("/productListUlist/:id",adminAuthMiddileware, adminController.productListUlist);

router.get("/order-List", adminAuthMiddileware, adminOrderController.orderList);

router.post("/order-List", adminAuthMiddileware ,adminOrderController.orderList)

router.get(
  "/order-details/:orderId",
  adminAuthMiddileware,
  adminOrderController.orderDetails
);

router.post("/ordered-order",adminAuthMiddileware , adminOrderController.ordered)

router.post("/cancel-order", adminAuthMiddileware, adminOrderController.orderCancel);

router.post("/place-order",adminAuthMiddileware, adminOrderController.orderPlaced)

router.post(
  "/accpetReturn-order",
  adminAuthMiddileware,
  adminOrderController.returnOrder
);

router.get("/coupon", adminAuthMiddileware, couponController.coupon)

router.post("/coupon", adminAuthMiddileware, couponController.addCoupon);

router.delete("/coupon", adminAuthMiddileware, couponController.couponDelete);


router.get(
  "/couponUpdate/:id",
  adminAuthMiddileware,
  couponController.couponEdit
);

router.post("/couponUpdate/:id", adminAuthMiddileware, couponController.couponUpdate);

router.get("/couponUlist/:id", adminAuthMiddileware, couponController.couponUlist);


router.get("/salesReport", adminAuthMiddileware,adminDashboardController.salesReport)


router.post("/sales",adminAuthMiddileware, adminDashboardController.sales)

router.get(
  "/status",
  adminAuthMiddileware,
  adminOrderController.status
);

router.get(
  "/salesReportDownload",
  adminAuthMiddileware,
  adminDashboardController.salesReportDownload
);


router.get("/sales-data",adminAuthMiddileware,adminDashboardController.salesData)

router.get('/sales-data-ones',adminAuthMiddileware,adminDashboardController.salesDataOnes)

router.get("/offer",adminAuthMiddileware, offerControllers.offer)

router.post("/offer",adminAuthMiddileware, offerControllers.addOffer)

router.get("/offer/:id",adminAuthMiddileware, offerControllers.offerUlist)

router.get("/offerEdit/:id",adminAuthMiddileware, offerControllers.offerEdit)

router.post("/offerUpdate",adminAuthMiddileware, offerControllers.offerUpdate)

router.delete("/offer",adminAuthMiddileware,offerControllers.offerDelete)
 


router.get("/categoryOffer",adminAuthMiddileware,offerControllers.offerCategory)

router.get("/categoryOfferRmove/:categoryId",adminAuthMiddileware,offerControllers.offerCategoryRemove)

router.get("/productOffer", adminAuthMiddileware, offerControllers.offerProduct)

router.get("/productOfferRmove/:productId",adminAuthMiddileware, offerControllers.offerProductRemove)


router.get("/topCounts",adminAuthMiddileware,adminDashboardController.topCounts)
module.exports = router;