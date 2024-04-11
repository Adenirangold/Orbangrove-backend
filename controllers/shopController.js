const Product = require("../models/product");
const AppError = require("../util/AppError");

// all filtering is going to take place here
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    if (!products) {
      return next(new AppError("no products", 400));
    }
    res.status(200).json({
      status: "success",
      data: {
        products: products,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
