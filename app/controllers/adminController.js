// app/controllers/adminController.js
const multer = require("multer");
const sharp = require("sharp");
const Product = require("../models/product");
const Admin = require("../models/admin");
const Category = require("../models/category");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs").promises;
const storage = multer.memoryStorage();
const uploads = multer({ storage: storage }).array("images", 15); 
const User = require("../models/user")
const mongoose = require("mongoose")
const  Order = require("../models/order");
const { error } = require("console");
const Offer = require("../models/offer")
// exports.adminSave = async(req,res)=>{
//   const { email, password } = req.body;
//   const hashPassword=await bcrypt.hash(password,10);
//   const newUsers = new Admin({
//       email,
//       password:hashPassword,
//   });
//   await newUsers.save(); 
//   res.send("success fully saved")
// }
// <....................................................................................................................>

const uploadDir = path.join(__dirname, "../../public/uploads");
// async function processAndSaveImages(files) {
//   const processedImages = [];

//   for (const file of files) {
//     try {
//       const sharpImageFileName = `${Date.now()}_${file.originalname}_sharp`;
//       let sharpInstance = sharp(file.buffer);

//       sharpInstance = sharpInstance.resize(640, 320, {
//         fit: "inside",
//         withoutEnlargement: true,
//       });

//       const metadataBefore = await sharp(file.buffer).metadata();
//       console.log(
//         `Original Dimensions: ${metadataBefore.width} x ${metadataBefore.height}`
//       );

//       let format;
//       if (file.mimetype === "image/jpeg") {
//         sharpInstance = sharpInstance.toFormat("jpeg", { quality: 80 });
//         format = "jpg";
//       } else if (file.mimetype === "image/png") {
//         sharpInstance = sharpInstance.toFormat("png", { compressionLevel: 9 });
//         format = "png";
//       } else if (file.mimetype === "image/webp") {
//         sharpInstance = sharpInstance.toFormat("webp", { quality: 80 });
//         format = "webp";
//       } else if (file.mimetype === "image/tiff") {
//         sharpInstance = sharpInstance.toFormat("tiff");
//         format = "tiff";
//       } else {
//         // Set a default format for unrecognized image types
//         sharpInstance = sharpInstance.toFormat("jpeg", { quality: 80 });
//         format = "jpg";
//       }

//       const sharpImagePath = path.join(
//         uploadDir,
//         `${sharpImageFileName}.${format}`
//       );
//       await sharpInstance.toFile(sharpImagePath);

//       // Verify the dimensions of the resized image
//       const resizedMetadata = await sharp(sharpImagePath).metadata();
//       console.log(
//         `Resized Dimensions: ${resizedMetadata.width} x ${resizedMetadata.height}`
//       );


//       // Use a relative path for serving images (e.g., in your HTML or API responses)
//       const relativePath = path.join(
//         "/uploads",
//         `${sharpImageFileName}.${format}`
//       );
//       processedImages.push(relativePath);
//     } catch (sharpError) {
//       console.error("Sharp error:", sharpError);
//     }
//   }

//   return processedImages;
// }

// <....................................................................................................................>
async function calculateWeeklySalesData() {
  const currentDate = new Date();
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000); 
  const weeklySalesData = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: oneWeekAgo }, 
              "items.orderStatus": "Delivered" 
          }
      },
      {
          $group: {
              _id: { $week: "$createdAt" }, 
              totalSales: { $sum: "$totalAmount" } 
          }
      }
  ]);

  return weeklySalesData;
}
async function calculateMonthlySalesData() {
  const currentDate = new Date();
  const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1); 
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0); 

  const monthlySalesData = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: oneMonthAgo, $lte: lastDayOfMonth }, 
              "items.orderStatus": "Delivered" 
          }
      },
      {
          $group: {
              _id: { $month: "$createdAt" }, 
              totalSales: { $sum: "$totalAmount" } 
          }
      }
  ]);

  return monthlySalesData;
}
async function calculateYearlySalesData() {
  const currentDate = new Date();
  const oneYearAgo = new Date(currentDate.getFullYear() - 1, 0, 1); 
  const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31); 

  const yearlySalesData = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: oneYearAgo, $lte: lastDayOfYear }, 
              "items.orderStatus": "Delivered" 
          }
      },
      {
          $group: {
              _id: { $year: "$createdAt" }, 
              totalSales: { $sum: "$totalAmount" } 
          }
      }
  ]);

  return yearlySalesData;
}

exports.admin = async(req, res) => {
  try {
    const weeklySalesData = await calculateWeeklySalesData();

    const monthlySalesData = await calculateMonthlySalesData();

    const yearlySalesData = await calculateYearlySalesData();
console.log(weeklySalesData);
    res.render("admin/adminDashboard", {
        weeklySalesData,
        monthlySalesData,
        yearlySalesData
    });

} catch (error) {
    console.error("Error rendering admin dashboard:", error);
    res.status(500).send("Internal Server Error");
}


};

// <....................................................................................................................>

exports.usersList = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page number
  const perPage = 10; // Items per page

  try {
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / perPage);

    const users = await User.find()
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("admin/userList", { users, totalPages, currentPage: page });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
 

// <....................................................................................................................>
exports.userUlist = async (req, res) => {
  const userId = req.params.id;
  const { isBlocked } = req.body;
  console.log(userId);
console.log(req.body);
  try { 
    const user = await User.findById(userId);
    if (user) {
      user.isBlocked = !user.isBlocked;
      const updatedUser = await user.save();
      if (updatedUser) {
        if(user.isBlocked){
  res.json({
    success: true,
    message:
      '<span style="color: white;">User has been blocked successfully.</span>',
  });
        }else{
            res.json({
              success: true,
              message:
                '<span style="color: white;">User has been unblocked successfully.</span>',
            });
        }
          

      } else {
            res.json({
              success: false,
              message: "OOps",
            });
;
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// <....................................................................................................................>
exports.signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      req.session.isAdminAuth =true ;
      console.log(req.session.isAdminAuth);
      res.render("admin/adminDashboard");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.error("error in adminlogin:", error);
    res.redirect("/admin");
  }
};
// <....................................................................................................................>
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/admin");
  });
}; 
// <....................................................................................................................>
exports.adminDashboard = async(req, res) => {

  try {
    const weeklySalesData = await calculateWeeklySalesData();

    const monthlySalesData = await calculateMonthlySalesData();

    const yearlySalesData = await calculateYearlySalesData();
console.log("weeklySalesData",weeklySalesData);
console.log("monthlySalesData",monthlySalesData);

    res.render("admin/adminDashboard", {
        weeklySalesData:weeklySalesData,
        monthlySalesData:monthlySalesData,
        yearlySalesData:yearlySalesData
    });

} catch (error) {
    console.error("Error rendering admin dashboard:", error);
    res.status(500).send("Internal Server Error");
}};
// <....................................................................................................................>
exports.addProduct = async (req, res) => {
  const category = await Category.find({ isListed: true });
  res.render("admin/addProduct", { category ,});
};
// <....................................................................................................................>
// exports.createProduct = async (req, res) => {
//   upload.array("images", 5)(req, res, async (err) => {
//     if (err) {
//       console.error("Multer error:", err);
//       return res.status(500).send("Error uploading file.");
//     }
//     const originalImages = req.files
//       ? req.files.map((file) => file.buffer)
//       : [];
//     if (originalImages.length === 0) {
//       return res.status(400).send("At least one image is required.");
//     }
//     try {
//       const processedImages = await processAndSaveImages(req.files);
//       const { productName, description, brand, price, quantity } = req.body;
//       const categorys = req.body.mycategory;
//       const products = new Product({
//         productName,
//         description,
//         brand,
//         price,
//         categorys,
//         quantity,
//         images: processedImages,
//       });
//       await products.save();
//       const category = await Category.find({ isListed: true });
//       res.render("admin/addProduct", { category });
//     } catch (sharpError) {
//       console.error("Sharp error:", sharpError);
//       res.status(500).send("Error processing and saving the images.");
//     }
//   });
// };
// <....................................................................................................................>

exports.createProduct = async (req, res) => {
  uploads(req, res, async (err) => {
    var filenames = [];
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }

    try {
      const { productName, description, brand, price, quantity } = req.body;
console.log("req.body.mycat",req.body);
      const sharpPromises = req.files.map(async (file, index) => {
        
        const filename = `image_${index + 1}.${file.originalname},${Date.now()}.jpg`;
        const imagePath = `public/uploads/${filename}`;

        await sharp(file.buffer)
          .resize(800,800, {
            fit: "contain",
            withoutEnlargement: true,
            background: "white",
          })
          .toFile(imagePath,{ quality: 80 });

        filenames.push(filename);
      });

      await Promise.all(sharpPromises);

      const categoryId = new mongoose.Types.ObjectId(req.body.category);
      const product = new Product({
        productName,
        description,
        brand,
        price,
        category:categoryId,
        quantity,
        images: filenames.map((filename) => `/uploads/${filename}`),
      });

      await product.save();

     res.json({status:true,message:"successfull"})
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });
};



exports.createCategory = async (req, res) => {
  const categories = await Category.find();
  const offers = await Offer.find()
  res.render("admin/categoryList", { categories, message: "" ,offers:offers});
};
// <....................................................................................................................>
exports.newCategory = async (req, res) => {
  try {
    const { category_name, about, description } = req.body;
    const categoryExist = await Category.findOne({ category_name });
    if (categoryExist) {
      console.log(categoryExist);
      const categories = await Category.find();
      res.render("admin/categoryList", {
        categories,
        message: "Category alraedy exists",
      });
      return;
    }
    const NewCategory = new Category({
      category_name,
      about,
      description,
    });
    if (NewCategory) {
      console.log("data reached", NewCategory);
      await NewCategory.save();
      res.setHeader("Cache-Control", "no-store, no-cache,private");
      res.redirect("/admin/newCategory");
    } else {
      console.log("data not reached");
      res.render("admin/dashboard");
    }
  } catch (error) {
    console.error("Category saving error", error);
    res.redirect("/admin/createCategory");
  }
};
// <....................................................................................................................>
exports.categoryList = async (req, res) => {
  const categories = await Category.find();
  try {
    res.render("admin/categoryList", { categories, message: "" });
  } catch (error) {
    console.log(error);
    res.render("admin/categoryList", { categories, message: error });
  }
};
// <....................................................................................................................>
exports.categoryDelete = async (req, res) => {
  const deleteId = req.params.id;
  try {
    const categoryDel = await Category.findByIdAndDelete(deleteId);
    console.log(categoryDel);
    if (categoryDel) {
res.json({success:true,message:"ok done"})
    } else {
      res.redirect("/admin/categoryList");
    }
  } catch (error) {
    res.redirect("/categoryList");
  }
};
// <..................................................................................................>
exports.categoryEdit = async (req, res) => {
  try {
    const categoryEditId = req.params.id;
    const { category_name, about, description } = req.body;
    console.log(categoryEditId);
    await Category.findByIdAndUpdate(categoryEditId, {
      category_name,
      about,
      description,
    });
    const category = await Category.findById(categoryEditId);
    console.log(category);
    res.render("admin/categoryEdit", { category ,message:""});
  } catch (error) {
    console.log(error);
  }
};
exports.categoryEditUpdate = async (req,res) =>{
   try {

     const categoryEditId = req.params.id;
     const { category_name, about, description } = req.body;
     console.log(categoryEditId);
    const categoryExist = await Category.findOne({ category_name });
    if (categoryExist) {
      console.log(categoryExist);
    const category = await Category.findById(categoryEditId);
      res.render("admin/categoryEdit", {
        category,
        message: "Category alraedy exists",
      });
      return;
    }

     await Category.findByIdAndUpdate(categoryEditId, {
       category_name,
       about,
       description,
     });
     const category = await Category.findById(categoryEditId);
     console.log(category);
     res.redirect(`/admin/newCategory`);
   } catch (error) {
     console.log(error);
   }
}

// <.........................................................................................................>
exports.categoryUlist = async (req, res) => {
  const categoryId = req.params.id;
  try { 
    const category = await Category.findById(categoryId);
    if (category) {
      category.isListed = !category.isListed;
      const updatedCategory = await category.save();
      if (updatedCategory) {
        res.json({success:true,message:"ok done"})
      } else {
        res.status(500).send("Failed to update category");
      }
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
// <.........................................................................................................>
exports.productList = async (req, res) => {
const page = parseInt(req.query.page)
const perPage = 6;
const offers = await Offer.find()
const totalUsers = await Product.countDocuments()
const totalPages = Math.ceil(totalUsers / perPage);

  const products = await Product.find()
  .skip((page-1)*perPage)
  .limit(perPage)
  // try{
  //   const
  // }catch(error){
  // }
  res.render("admin/productList", { products,totalPages, currentPage:page ,offers:offers});
};
// <.........................................................................................................>
exports.productCategory = async (req, res) => {
  const categoryId = req.params;
  const categoryList = await Category.findById(categoryId);
  res.render("admin/productList", { products: categoryList });
};
// <.........................................................................................................>
exports.productListEdit = async (req, res) => {
  
try{
   const productEditId = req.params.id;
 const category = await Category.find();

   const products = await Product.findById({ _id: productEditId }).populate("category").exec();
   console.log(products);
   res.render("admin/productListEdit", { products, category });
}catch(error){
  console.log(error);
}
};

exports.productListEditUpdate = async (req, res) => {
  uploads(req, res, async (err) => {
    var filenames = [];
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }

    try {
      const { productName, description, brand, price, quantity } =
        req.body;
        console.log(req.body);
    const productId = req.params.id
        const existingProduct = await Product.findById(productId);
        console.log("Existing Product:", existingProduct);


      const sharpPromises = req.files.map(async (file, index) => {
        const filename = `image_${index + 1}.${file.originalname}.jpg`;
        const imagePath = `public/uploads/${filename}`;

        await sharp(file.buffer)
          .resize(300, 300, {
            fit: "contain",
            withoutEnlargement: true,
            background: "white",
          })
          .toFile(imagePath, { quality: 90 });

        filenames.push(filename);
      });

      await Promise.all(sharpPromises);

      const categoryId = new mongoose.Types.ObjectId(req.body.mycategory);

      await Product.findByIdAndUpdate(productId, {
        productName,
        description,
        brand,
        price,
        category: categoryId,
        quantity,
        $push: {
          images: {
            $each: filenames.map((filename) => `/uploads/${filename}`),
          },
        },
      });

      const products = await Product.find();

      res.redirect("/admin/productList")
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });
};




exports.productEditDeleteImage = async (req, res) => {
  const { productId, imageIndex } = req.params;

  //   await fs.unlink(`../../public/uploads/${imageUrl}`);
  try {
    const product = await Product.findById({_id:productId});
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    //     res
    //       .status(200)
    //       .json({
    //         success: true,
    //         message: "Image deleted successfully",
    //         product: updatedProduct,
    //       });
    // }
    // Check if the product has the images property and it's an array
    if (!product.images || !Array.isArray(product.images)) {
      return res.status(400).json({ message: "Invalid product data" });
    }

    console.log(product.images[imageIndex]);

    // Remove the image file from the server
    const imagePathToDelete = path.join(
      __dirname,
      "..",
      "..",
      "public",
      product.images[imageIndex]
    );
    console.log(imagePathToDelete);
    await fs.unlink(imagePathToDelete);

    // Remove the image path from the product images array
    product.images.splice(imageIndex, 1);

    await product.save();

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// <.........................................................................................................>
exports.productListDelete = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.redirect("/admin/productList");
    }
    console.log("Product is deleted", product);
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(async (imagePath) => { 
          const filePath = path.join(
            "public",
            imagePath.replace("\\uploads\\", "uploads\\")
          );
          console.log(filePath);
          try {
            const fileStat = await fs.stat(filePath);
            if (fileStat && fileStat.isFile()) {
              await fs.unlink(filePath);
              console.log(`File ${filePath} deleted`);
            }
          } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
          }
        })
      );
    }
    res.json({success:true,message:"ok done"})
  } catch (error) {
    console.error(error);
    res.redirect("/admin/productList");
  }
};

// exports.productEditAddImage = async (req,res) =>{
//   try{
// const {productId ,imageIndex} = req.params
// const product = await Product.findById({_id:productId})
// if(!product){
//         return res.status(404).json({ message: "Product not found" });
// }
//   }catch(error){

//   }
// }
// <....................................................................................................................>
exports.productListUlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const productUlist = await Product.findById(productId);
    if (productUlist) {
      productUlist.isListed = !productUlist.isListed;
      const updatedProduct = await productUlist.save();
      console.log(updatedProduct);
      if (updatedProduct) {
        res.json({success:true,message:"ok done"})
      } else {
        res.status(500).send("Failed to update product");
      }
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }

  
};


