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
const upload = multer({ storage: storage });

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
async function processAndSaveImages(files){
  const processedImages = [];

  for (const file of files) {
    const sharpImageFileName = `${Date.now()}_${file.originalname}_sharp`;

    let sharpInstance = sharp(file.buffer).resize(300, 400, {
      fit: "fill",
      withoutEnlargement: true,
    });

    let format;

    if (file.mimetype === "image/jpeg") {
      sharpInstance = sharpInstance.toFormat("jpeg", { quality: 80 });
      format = "jpg";
    } else if (file.mimetype === "image/png") {
      sharpInstance = sharpInstance.toFormat("png", { compressionLevel: 9 });
      format = "png";
    } else if (file.mimetype === "image/webp") {
      sharpInstance = sharpInstance.toFormat("webp", { quality: 80 });
      format = "webp";
    } else if (file.mimetype === "image/tiff") {
      sharpInstance = sharpInstance.toFormat("tiff");
      format = "tiff";
    } else {
      // Set a default format for unrecognized image types
      sharpInstance = sharpInstance.toFormat("jpeg", { quality: 80 });
      format = "jpg";
    }

    try {
      let sharpImagePath = path.join(
        uploadDir,
        `${sharpImageFileName}.${format}`
      );
      await sharpInstance.toFile(sharpImagePath);
      sharpImagePath = path.join("/uploads", `${sharpImageFileName}.${format}`);
      processedImages.push(sharpImagePath);
    } catch (sharpError) {
      console.error("Sharp error:", sharpError);
    }
  }

  return processedImages;
};





exports.admin = (req, res) => {
  if (req.session.isAdminAuth) {
    res.render("admin/adminDashboard");
  } else {
    res.render("admin/signIn");
  }
};


// <....................................................................................................................>


exports.signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      req.session.isAdminAuth = true;
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
  req.session.isAdminAuth = false;
  req.session.destroy(() => {
    res.redirect("/admin");
  });
};

// <....................................................................................................................>


exports.adminDashboard = (req, res) => {
  res.render("admin/adminDashboard");
};

// <....................................................................................................................>



exports.addProduct = async (req, res) => {
  const category = await Category.find({ isListed: true });
  res.render("admin/addProduct", { category });
};

// <....................................................................................................................>


exports.createProduct = async (req, res) => {
  upload.array("images", 5)(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading file.");
    }

    const originalImages = req.files
      ? req.files.map((file) => file.buffer)
      : [];

    if (originalImages.length === 0) {
      return res.status(400).send("At least one image is required.");
    }

    try {
      const processedImages = await processAndSaveImages(req.files);

      const { productName, description, brand, price, quantity } = req.body;
      const categorys = req.body.mycategory;

      const products = new Product({
        productName,
        description,
        brand,
        price,
        categorys,
        quantity,
        images: processedImages,
      });

      await products.save();

      const category = await Category.find({ isListed: true });
      res.render("admin/addProduct", { category });
    } catch (sharpError) {
      console.error("Sharp error:", sharpError);
      res.status(500).send("Error processing and saving the images.");
    }
  });
};

// <....................................................................................................................>


 
exports.createCategory = async (req, res) => {
  const categories = await Category.find();

  res.render("admin/categoryList", { categories, message: "" });
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
      res.redirect("/admin/categoryList");
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

    res.render("admin/categoryEdit", { category });
  } catch (error) {
    console.log(error);
  }
};
// <.........................................................................................................>
exports.categoryUlist = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findById(categoryId);

    if (category) {
      category.isListed = !category.isListed;

      const updatedCategory = await category.save();

      if (updatedCategory) {
        res.redirect("/admin/categoryList");
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

exports.productList = async (req,res)=>{

const products = await Product.find()


// try{
//   const 
// }catch(error){

// }
res.render('admin/productList',{products})
}
// <.........................................................................................................>


exports.productCategory = async (req,res)=>{

const categoryId = req.params
const categoryList = await Category.findById(categoryId)


res.render("admin/productList", { products: categoryList });

}
// <.........................................................................................................>


exports.productListEdit = async (req, res) => {
  try {
    const productEditId = req.params.id;
    console.log("product list>", productEditId);
    const { productName, description, brand, price, categorys, quantity } =
      req.body;

    const category = await Category.find();
    const products = await Product.findById(productEditId);

    // Logging to check the structure of the retrieved product document
    console.log(products);

    res.render("admin/productListEdit", { products: products, category });
  } catch (sharpError) {
    console.error("Sharp error:", sharpError);
    res.status(500).send("Error processing and saving the images.");
  }
};

  


exports.productEditDeleteImage = async (req, res) => {
  const { productId, imageIndex } = req.params;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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

    res.redirect("/admin/productList");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/productList");
  }
};

// <....................................................................................................................>


exports.productListUlist = async (req,res)=>{

  try{
    const productId = req.params.id 
    const productUlist = await Product.findById(productId)
    if(productUlist){
      productUlist.isListed = !productUlist.isListed
      const updatedProduct = await productUlist.save()
    console.log(updatedProduct);
      if(updatedProduct){
        res.redirect("/admin/productList")
      }else{
        res.status(500).send("Failed to update product");
      }
    }else{
      res.status(404).send("Product not found");
    }
  }catch(error){
 console.log(error);
    res.status(500).send("Internal Server Error")
  }
}




