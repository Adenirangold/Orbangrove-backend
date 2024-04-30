const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    default: "no category",
    enum: ["men", "women", "sports", "lingerie", "footwears", "accessories"],
  },
});

module.exports = mongoose.model("Category", categorySchema);
