const User = require("../models/user")
const Product = require("../models/product")
const CartItem = require("../models/cartItem")

class CartController {
  async addToCart(userId, productId, quantity) {
    console.log("1", userId);
    console.log("2", userId, productId, quantity);
    try {
      const user = await User.findById(userId);
      const product = await Product.findById(productId);
      console.log(product);
      console.log("3", userId, productId, quantity);
      if (!user || !product) {
        throw new Error("User or product not found");
      }

      let cartItem = await CartItem.findOne({ userId, productId });
      console.log("4cartitemlet==>", cartItem);

      if (cartItem) {
        cartItem.quantity += quantity;
        console.log("5cartitemif==>", cartItem);
      } else {
        cartItem = new CartItem({ userId, productId, quantity });
        console.log("6cartitemelse==>", cartItem);
      }

      await cartItem.save();
      return { message: "Item added to cart successfully" };
    } catch (error) {
      throw new Error("Error adding item to cart");
    }
  }

  async getCart(userId) {
    try {
      const cartItems = await CartItem.find({ userId }).populate("productId");
      return { cartItems };
    } catch (error) {
    //   console.error("Error getting cart items:", error); // Log the detailed error
      throw new Error("Error getting cart items");
    }
  }

  async updateQuantity(userId, productId, quantity) {
    try {
      const cartItem = await CartItem.findOne({ userId, productId });

      if (!cartItem) {
        throw new Error("Cart item not foundk");
      }

      cartItem.quantity = quantity;
      await cartItem.save();
      return { message: "quantity updated successfully" };
    } catch (error) {
      throw new Error("Error updating quantity");
    }
  }

  async removeFromCart(userId, productId) {
    try {
      await CartItem.findOneAndDelete({ userId, productId });
      return { message: "Item removed from cart successfully" };
    } catch (error) {
      throw new Error("Error removing item from cart");
    }
  }
}

module.exports = new CartController