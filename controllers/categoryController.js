const Category = require("../models/category");
const AppError = require("../util/AppError");

exports.createCategory = async (req, res, next) => {
  try {
    await Category.create({
      name: req.body.name,
    });
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getAllCategory = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      status: "success",
      data: categories,
    });
  } catch (err) {
    next(new AppError(err.message, 401));
  }
};
