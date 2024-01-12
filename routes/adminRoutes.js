// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../app/controllers/adminController");
const adminAuthMiddileware = require("../app/middilewares/adminAuth");
const path = require('path')

router.get("/admin",adminController.admin)

// Admin sign-in route
router.post("/signin", adminController.signIn);

// Admin Logout

router.get("/adminLogout", adminController.logout);

// Admin Dashboard
router.get("/dashboard", adminController.adminDashboard);

// Product management routes
// router.post("/addProduct", adminController.addProduct);

//Product Creation routes
router.get("/createProduct", adminController.addProduct)

router.post("/createProduct", adminController.createProduct);

router.get("/newCategory",adminController.createCategory)

router.post("/newCategory",adminController.newCategory); 

router.get("/categoryList", adminController.categoryList);

router.get("/categoryDelete/:id",adminController.categoryDelete)

router.get("/categoryEdit/:id",adminController.categoryEdit);

router.post("/categoryEdit/:id", adminController.categoryEdit);

router.get("/categoryUlist/:id", adminController.categoryUlist);

router.get("/productList", adminController.productList);

router.get("/productCategory/:id", adminController.productCategory);

router.get("/productListEdit/:id", adminController.productListEdit);

router.post("/productListEdit",adminController.productListEdit)

router.delete(
  "/productListEdit/:productId/images/:imageIndex",
  adminController.productEditDeleteImage
);

router.get("/productListDelete/:id", adminController.productListDelete);

router.get("/productListUlist/:id", adminController.productListUlist);

module.exports = router; 