const Product = require("../models/product");
const AppError = require("../util/AppError");

exports.getAllProducts = async (req, res, next) => {
  try {
    const category = req.query.category;
    const query = category ? { category } : {};

    const products = await Product.find(query);

    if (!products.length) {
      return next(new AppError("No products found", 404));
    }

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    next(new AppError("Failed to fetch products", 500));
  }
};
