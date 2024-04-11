const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    default: "No category",
  },
});

module.exports = mongoose.model("Category", categorySchema);
