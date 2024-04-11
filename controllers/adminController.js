const User = require("../models/user");
const Product = require("../models/product");
const AppError = require("../util/AppError");
const { deleteImage } = require("../util/deleteImage");

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    if (!products) {
      return next(
        new AppError(
          "this user does not have any product. please create your product"
        )
      );
    }

    res.status(200).json({
      status: "sucess",
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
      return next(new AppError("No file uploaded", 500));
    }
    imageUrl = req.file.path;

    const product = await Product.create({
      userId: userid,
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: imageUrl,
      stockQuantity: req.body.stockQuantity,
      salesprice: req.body.salesprice,
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
    let imageUrl;
    const { image } = await Product.findById(id).select("image");

    imageUrl = image;

    if (req.file) {
      imageUrl = req.file.path;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price,
        salesprice,
        description,
        stockQuantity,
        image: imageUrl,
      },
      {
        runValidators: true,
        new: true,
      }
    );
    if (product.image !== image) {
      deleteImage(image);
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
      const imageUrl = product.image;
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
