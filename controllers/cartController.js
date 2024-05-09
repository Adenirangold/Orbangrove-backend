const AppError = require("../util/AppError");
const Product = require("../models/product");
const Cart = require("../models/cart");
const mongoose = require("mongoose");

exports.addProductToCart = async function (req, res, next) {
  const { sessionId } = req.session;
  const { productId, quantity } = req.body;
  try {
    let userId;
    let cart;
    if (req.user) {
      userId = req.user._id;
      cart = await Cart.findOne({ userId });
    } else {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      const cartData = userId ? { userId } : { sessionId };
      cart = new Cart({ ...cartData, items: [{ productId, quantity }] });
    } else {
      //   console.log(cart.items);
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );

      const existingItem = cart.items[existingItemIndex];
      console.log(existingItem);

      if (existingItem) {
        existingItem.quantity = existingItem.quantity + quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }
    await cart.save();
    res.status(200).json({
      status: "success",
      message: "Product added to cart successfully",
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};
exports.removeProductFromCart = () => {};
exports.getCart = () => {};
