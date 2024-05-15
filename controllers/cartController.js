const AppError = require("../util/AppError");
const Product = require("../models/product");
const Cart = require("../models/cart");

exports.addProductToCart = async function (req, res, next) {
  const { sessionId } = req.session;
  const { productId, quantity } = req.body;
  try {
    let userId;
    let cart;
    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }
    if (req.user) {
      userId = req.user._id;
      cart = await Cart.findOne({ userId });
    } else {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      const cartData = userId ? { userId } : { sessionId };
      cart = new Cart({
        ...cartData,
        items: [{ productId: product._id, quantity }],
      });
    } else {
      //   console.log(cart.items);
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );

      const existingItem = cart.items[existingItemIndex];

      if (existingItem) {
        existingItem.quantity = existingItem.quantity + quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }
    await cart.save();
    res.status(200).json({
      status: "Success",

      data: {
        userId: cart.userId,
        sessionId: cart.sessionId,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};
exports.getCart = async (req, res, next) => {
  try {
    let cart;

    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id }).populate(
        "items.productId"
      );
    } else if (req.headers.authorization.startsWith("Session")) {
      const sessionId = req.headers.authorization.split(" ")[1];
      cart = await Cart.findOne({ sessionId }).populate("items.productId");
    } else {
      return next(new AppError("User not authenticated", 401));
    }

    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    res.status(200).json({
      status: "Success",
      data: {
        cart,
      },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

exports.removeProductFromCart = async (req, res, next) => {
  const sessionId = req.headers.authorization.split(" ")[1];

  try {
    if (!req.user && !sessionId) {
      return next(new AppError("User not authenticated", 401));
    }

    let cart;

    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    const productId = req.params.productId;
    console.log(cart);

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    // Send a success response
    res.status(200).json({
      status: "Success",
      message: "Product removed from cart successfully",
      data: {
        cart,
      },
    });
  } catch (error) {
    // Handle any errors
    next(new AppError("Internal server error", 500));
  }
};
