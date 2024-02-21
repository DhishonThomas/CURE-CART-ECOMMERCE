const Wishlist = require("../models/wishlist");


const wishList = {
  wishlist: async (req, res) => {
    try {
      const userId = res.locals.user;
      const wishList = await Wishlist.findOne({ user: userId })
        .populate("products.productId")
        .exec();
      res.render("user/wishList", { wishList });
    } catch (error) {
      console.log(error);
    }
  },

  wishlistAdd: async (req, res) => {
    try {
      const userId = req.session.isUserAuth;
      const { productId } = req.body;

     let wishlist = await Wishlist.findOne({ user: userId });
     if (!wishlist) {
       wishlist = new Wishlist({ user: userId, products: [] });
     }

      const existProductIndex = wishlist.products.findIndex((item) =>
        item.productId.equals(productId)
      );

      if (existProductIndex !== -1) {
        return res
          .status(400)
          .json({ error: "Product already exists in wishlist" });
      }

      wishlist.products.push({ productId });
      await wishlist.save();

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  wishlistRemove: async (req, res) => {
    try {
      const productId = req.params.productId;
console.log("productId", productId);
      const wishlist = await Wishlist.findOneAndUpdate(
        { user: res.locals.user },
        { $pull: { products: { productId: productId } } },
        { new: true }
      );
      console.log(wishlist);
console.log("save worked");
      await wishlist.save();
      res.json({ success: true });
    } catch (error) {
      console.log(error);
    }
  },
}; 

module.exports=wishList