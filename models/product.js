const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: [true, "the name field is required"],
  },
  price: {
    type: Number,
    required: [true, "the price field is required"],
    min: 0,
  },
  salesprice: {
    type: Number,
  },

  description: {
    type: String,
    required: [true, "the description field is required"],
  },
  imageUrl: {
    type: String,
  },
  stockQuantity: {
    type: String,
    default: 0,
    required: [true, "the stockQuantity field is required"],
  },
  category: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
