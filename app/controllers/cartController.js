const User = require("../models/user")
const Product = require("../models/product")
const UserCart = require("../models/cartItem");
const mongoose = require("mongoose")
const { ObjectId } = require("mongoose").Types;


class CartController {
  async addToCart(userId, productId, quantity) {
    console.log("1", userId);
    console.log("2", userId, productId, quantity);
    try {
     const producrIds =new ObjectId(productId);
          //  console.log(producrIds);

      const user = await User.findById(userId);
      const product = await Product.findOne({ _id: producrIds });
      console.log("3", userId, productId, quantity);
console.log(productId);
      if (!user || !product) {
        throw new Error("User or product not found");
      }

      console.log("reached to user cart");
      
      let userCart = await UserCart.findOne({ userId });
const productPrices = await Product.findOne({ _id: producrIds });

const productPrice = productPrices.price;
const total = userCart.totalAmount

console.log("Total==>",total);
const productTotal = productPrice

userCart.totalAmount += productTotal;

await userCart.save()

console.log("productPrice:", productPrice,productId);


      console.log("4userCart==>", userCart);

      if (!userCart) {

        userCart = new UserCart({ userId, cartItems: [] });
      }

      let cartItem = userCart.cartItems.find((item) =>
        item.productId.equals(productId)
      );
//*******************************pushing to array in the usercart cartitemsv -******************
      if (cartItem) {
        cartItem.quantity += quantity;
        console.log("5cartItemIf==>", cartItem);
      } else {
        userCart.cartItems.push({ productId, quantity });
        console.log("6cartItemElse==>", userCart.cartItems);
      }

      await userCart.save();
      return { message: "Item added to cart successfully" };
    } catch (error) {
      throw new Error("Error adding item to cart");
    }
  }

  async getCart(userId) {
    try {
      console.log("reached", userId);
      const userCart = await UserCart.findOne({ userId }).populate(
        "cartItems.productId"
      );


      const cartItems = userCart ? userCart.cartItems : [];
      return { cartItems ,userCart};
    } catch (error) {
      console.error("Error getting cart items:", error);
      throw new Error("Error getting cart items");
    }
  }

  //<.......................This  calculate Total can be used if it calls this keyword example:    const {total,itemTotals} = await this.calculateTotal(userCart.cartItems);>
  // async  calculateTotal(cartItems) {
  //   let total = 0;
  //   let itemTotals =[]

  //   for (const cartItem of cartItems) {
  //     try {
  //       const product = await Product.findById(cartItem.productId)
  // console.log("product",product);
  //       if (!product) {
  //         console.error(`Product not found for ${cartItem.productId}`);
  //         continue; // Skip this item and proceed to the next one
  //       }

  //       const { quantity } = cartItem;

  //       const { price } = product;
  //       const itemTotal = quantity * price;

  //       console.log(
  //         `Product: ${product.productName}, Quantity: ${quantity}, Price: ${price}, Item Total: ${itemTotal}`
  //       );
  // console.log(itemTotal);
  //       total += itemTotal;
  //             itemTotals.push({ itemId: cartItem._id, itemTotal });

  //       console.log("total", total);
  //     } catch (error) {
  //       console.error(`Error fetching product for ${cartItem.productId}`, error);
  //     }
  //   }

  //   return {total,itemTotals}; // Return the calculated total directly (not as a promise)
  // }

  //<........................Using  Promise alo we can do method in promise>

  // async calculateTotal(cartItems) {
  //   let total = 0;
  //   let itemTotals = [];

  //   for (const cartItem of cartItems) {
  //     try {
  //       const product = await Product.findById(cartItem.productId);
  //       console.log("product", product);
  //       if (!product) {
  //         console.error(`Product not found for ${cartItem.productId}`);
  //         continue;
  //       }

  //       const { quantity } = cartItem;

  //       const { price } = product;
  //       const itemTotal = quantity * price;

  //       console.log(
  //         `Product: ${product.productName}, Quantity: ${quantity}, Price: ${price}, Item Total: ${itemTotal}`
  //       );
  //       console.log(itemTotal);
  //       total += itemTotal;
  //       itemTotals.push({ itemId: cartItem._id, itemTotal });

  //       console.log("total", total);
  //     } catch (error) {
  //       console.error(
  //         `Error fetching product for ${cartItem.productId}`,
  //         error
  //       );
  //     }
  //   }

  //   return { total, itemTotals };
  // }

  async updateQuantity(userId, itemId, newQuantity) {
    async function calculateTotal(cartItems) {
      let total = 0;
      let itemTotals = [];

      for (const cartItem of cartItems) {
        try {
          const product = await Product.findById(cartItem.productId);
          console.log("product", product);
          if (!product) {
            console.error(`Product not found for ${cartItem.productId}`);
            continue;
          }

          const { quantity } = cartItem;

          const { price } = product;
          const itemTotal = quantity * price;

          console.log(
            `Product: ${product.productName}, Quantity: ${quantity}, Price: ${price}, Item Total: ${itemTotal}`
          );
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

    const total = userCart.totalAmount
    const price = userCart.cartItems[itemIndex].productId.price
console.log("price:", price);
const updateTotal = total - (price * quantity)
    console.log("quantity:",quantity);
console.log("updateTotal:", updateTotal);
    console.log("total", total);
    userCart.totalAmount = updateTotal;
await userCart.save()

      const result = await UserCart.updateOne(filter, update);




      console.log("userCart after deleting", result);

      return { success: true, userCart };
    } catch (error) {
      console.error(error);
      throw new Error("Error removing item from cart");
    }
  }
}

module.exports = new CartController