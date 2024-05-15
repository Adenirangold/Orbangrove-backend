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
    if (!products || products.length === 0) {
      return next(
        new AppError(
          "You don't have any products. Please create your products.",
          404
        )
      );
    }

    res.status(200).json({
      status: "Success",
      data: {
        products: products,
      },
    });
  } catch (err) {
    next(
      new AppError("Failed to retrieve products. Please try again later.", 500)
    );
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const userid = req.user._id;
    let imageUrl;
    if (!req.file) {
      imageUrl = undefined;
      return next(new AppError("No image uploaded", 400));
    }
    imageUrl = req.file.path;

    const { name, price, description, category, stockQuantity, salesprice } =
      req.body;

    const categories = category.split("|");
    const newCategory = [];

    for (cat of categories) {
      const existingCategory = await Category.findOne({ name: cat });
      if (!existingCategory)
        return next(new AppError(`Category "${cat}" does not exist`, 400));
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
      status: "Success",
      data: {
        product: product,
      },
    });
  } catch (err) {
    next(
      new AppError("Failed to create product. Please try again later.", 500)
    );
  }
};

exports.editProduct = async (req, res, next) => {
  try {
    const id = req.params.productId;

    const { name, price, salesprice, description, stockQuantity, category } =
      req.body;

    let image;
    let newCategory;
    const existingProduct = await Product.findById(id).select("imageUrl");
    if (!existingProduct) {
      return next(new AppError("No product found with that ID", 404));
    }
    image = existingProduct.imageUrl;

    if (req.file) {
      image = req.file.path;
    }

    if (category) {
      newCategory = [];

      const categories = category.split("|");

      for (cat of categories) {
        existingCategory = await Category.findOne({ name: cat });
        if (!existingCategory)
          return next(new AppError(`Category "${cat}" does not exist`, 400));
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

    if (product.imageUrl !== image) {
      deleteImage(existingProduct.imageUrl);
    }

    res.status(200).json({
      status: "Success",
      data: {
        product: product,
      },
    });
  } catch (err) {
    next(new AppError("Failed to edit product. Please try again later.", 500));
  }
};
exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.productId;
    const product = await Product.findByIdAndDelete(id);
    if (product) {
      const imageUrl = product.imageUrl;
      deleteImage(imageUrl);
    } else {
      return next(new AppError("No product found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      message: "product deleted sucessfully",
    });
  } catch (err) {
    next(
      new AppError("Failed to delete product. Please try again later.", 500)
    );
  }
};
