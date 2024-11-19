const User = require("../models/user");
const Product = require("../models/product");
const UserCart = require("../models/cartItem");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types;

class CartController {
  async addToCart(userId, productId, quantity) {
    try {
        const productIds = new ObjectId(productId);

        const user = await User.findById(userId);
        const product = await Product.findOne({ _id: productIds })
            .populate({
                path: 'category',
                populate: {
                    path: 'offer'
                }
            })
            .populate('offer');

        if (!user || !product) {
            throw new Error("User or product not found");
        }

        let userCart = await UserCart.findOne({ userId });
        if (!userCart) {
            userCart = new UserCart({ userId, cartItems: [], totalAmount: 0 });
        }

        let productPrice;

        if (product.offer) {
            productPrice = (product.price * (1 - product.offer.discountPercentage / 100)).toFixed(2);
        } else if (product.category && product.category.offer) {
            productPrice = (product.price * (1 - product.category.offer.discountPercentage / 100)).toFixed(2);
        } else {
            productPrice = product.price.toFixed(2);
        }

        const productTotal = (parseFloat(productPrice) * quantity).toFixed(2);
        userCart.totalAmount += parseFloat(productTotal);

        userCart.cartItems.push({ productId: product._id, quantity, price: productTotal });

        await userCart.save();
        return { message: "Item added to cart successfully" };
    } catch (error) {
        throw new Error("Error adding item to cart");
    }
}


  async getCart(userId) {
    try {
      console.log("reached", userId);
      const userCart = await UserCart.findOne({ userId }).populate({
        path:"cartItems.productId",
        populate:{
          path:"offer"
        }
      })
      .populate({path:"cartItems.productId.category",
      populate:{
        path:"offer"
      }
      })

      const cartItems = userCart ? userCart.cartItems : [];
      return { cartItems, userCart };
    } catch (error) {
      console.error("Error getting cart items:", error);
      throw new Error("Error getting cart items");
    }
  }

  async updateQuantity(userId, itemId, newQuantity) {
    async function calculateTotal(cartItems) {
      let total = 0;
      let itemTotals = [];
console.log("uhyguydsgfuydghdsfydtsudsfguhys",cartItems);
      for (const cartItem of cartItems) {
        try {
          const product = await Product.findById(cartItem.productId);
          // const productPrice = await UserCart.findById()
          console.log("product", product);
          if (!product) {
            console.error(`Product not found for ${cartItem.productId}`);
            continue;
          }

          const { quantity } = cartItem;

          const { price } = cartItem;
          const itemTotal = quantity * price;

          console.log(itemTotal);
          total += itemTotal;
          itemTotals.push({ itemId: cartItem._id, itemTotal });

          console.log("total", total);
        } catch (error) {
          console.error(
            `Error fetching product for ${cartItem.productId}`,
            error
          );
        }
      }

      return { total, itemTotals };
    }

    try {
      const userCart = await UserCart.findOne({ userId });

      if (!userCart) {
        throw new Error("User cart not found");
      }

      const cartItem = userCart.cartItems.find((item) =>
        item._id.equals(itemId)
      );

      if (!cartItem) {
        throw new Error("Cart item not found"); 
      }

      cartItem.quantity = newQuantity;
      await userCart.save();
      console.log("userCart.cartItems", userCart.cartItems);
      const { total, itemTotals } = await calculateTotal(userCart.cartItems);

      userCart.totalAmount = total;
      await userCart.save();

      console.log("Toatl after function", total);

      console.log("Total:", total);
      console.log("itemTotals", itemTotals);
      return { success: true, total, itemTotals };
    } catch (error) {
      return { success: false, message: "Error updating quantity" };
    }
  }

  async removeFromCart(userIdObj, itemId) {
    try {
      // const userIdObj =new ObjectId(userId);
      const itemIdObj = new ObjectId(itemId);

      console.log("userIdObj", userIdObj);
      console.log("itemIdObj", itemIdObj);

      const userCart = await UserCart.findOne({ userId: userIdObj }).populate(
        "cartItems.productId"
      );

      if (!userCart) {
        console.log("User cart not found");
        return { success: false, message: "User cart not found" };
      }
      const filter = { userId: userIdObj };
      const update = {
        $pull: {
          cartItems: { _id: itemIdObj },
        },
      };

      // userCart.cartItems.forEach(item=>{

      // })

      const itemIndex = userCart.cartItems.findIndex((item) =>
        item._id.equals(itemId)
      );

      const quantity = userCart.cartItems[itemIndex].quantity;

      const total = userCart.totalAmount;
      const price = userCart.cartItems[itemIndex].price;
      // console.log("price:", price);
      const updateTotal = total - price * quantity;
      // console.log("quantity:",quantity);
      // console.log("updateTotal:", updateTotal);
      // console.log("total", total);
      userCart.totalAmount = updateTotal;
      console.log("total removed from the cart",updateTotal);
      await userCart.save();

      const result = await UserCart.updateOne(filter, update);

      console.log("userCart after deleting", result);

      return { success: true, userCart };
    } catch (error) {
      console.error(error);
      throw new Error("Error removing item from cart");
    }
  }
}

module.exports = new CartController();
