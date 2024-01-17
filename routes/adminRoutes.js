// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../app/controllers/adminController");
const adminAuthMiddileware = require("../app/middilewares/adminAuth");
const path = require('path')

router.get("/admin", adminAuthMiddileware,adminController.admin);

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

router.post("/categoryEdit/:id", adminController.categoryEdit);

router.get("/categoryUlist/:id",adminAuthMiddileware, adminController.categoryUlist);

router.get("/productList",adminAuthMiddileware, adminController.productList);

router.get("/productCategory/:id",adminAuthMiddileware, adminController.productCategory);

router.get("/productListEdit/:id",adminAuthMiddileware, adminController.productListEdit);

router.post("/productListEdit",adminController.productListEdit)

router.delete(
  "/productListEdit/:productId/images/:imageIndex",
 adminAuthMiddileware, adminController.productEditDeleteImage
);

router.get("/productListDelete/:id",adminAuthMiddileware, adminController.productListDelete);

router.get("/productListUlist/:id",adminAuthMiddileware, adminController.productListUlist);

module.exports = router; 