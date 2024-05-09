const User = require("../models/user");
const Product = require("../models/product");
const Category = require("../models/category");
const AppError = require("../util/AppError");
const { deleteImage } = require("../util/deleteImage");

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user._id })
      .populate({
        path: "category",
        select: "name",
      })
      .exec();
    if (!products) {
      return next(
        new AppError(
          "this user does not have any product. please create your product"
        )
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        products: products,
      },
    });
  } catch (err) {
    next(new AppError(err.msg, 400));
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const userid = req.user._id;
    let imageUrl;
    if (!req.file) {
      imageUrl = undefined;
      return next(new AppError("No image uploaded", 500));
    }
    imageUrl = req.file.path;

    const { name, price, description, category, stockQuantity, salesprice } =
      req.body;

    const categories = category.split("|");
    const newCategory = [];

    for (cat of categories) {
      const existingCategory = await Category.findOne({ name: cat });
      if (!existingCategory)
        return next(new AppError("category does not exist", 400));
      newCategory.push(existingCategory._id);
    }

    const product = await Product.create({
      userId: userid,
      name,
      price,
      description,
      category: newCategory,
      stockQuantity,
      salesprice,
      imageUrl,
    });
    res.status(201).json({
      status: "success",
      data: {
        product: product,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.editProduct = async (req, res, next) => {
  try {
    const id = req.params.productId;
    const name = req.body.name;
    const price = req.body.price;
    const salesprice = req.body.salesprice;
    const description = req.body.description;
    const stockQuantity = req.body.stockQuantity;
    const category = req.body.category;
    let image;
    let newCategory;
    const { imageUrl } = await Product.findById(id).select("imageUrl");
    console.log(imageUrl);

    image = imageUrl;

    if (req.file) {
      image = req.file.path;
    }

    if (category) {
      newCategory = [];

      const categories = category.split("|");

      for (cat of categories) {
        existingCategory = await Category.findOne({ name: cat });
        if (!existingCategory)
          return next(new AppError("this category does not exist", 400));
        newCategory.push(existingCategory._id);
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price,
        salesprice,
        description,
        stockQuantity,
        imageUrl: image,
        category: newCategory,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    if (product.imageUrl === image) {
      deleteImage(imageUrl);
    }

    if (!product) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        product: product,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.productId;
    const product = await Product.findByIdAndDelete(id);
    if (product) {
      const imageUrl = product.imageUrl;
      deleteImage(imageUrl);
    }
    res.status(200).json({
      status: "success",
      message: "product deleted sucessfully",
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
