const fs = require("fs");
const path = require("path");

exports.deleteImage = (imagePath) => {
  const p = path.join(path.dirname(require.main.filename), imagePath);

  fs.unlink(p, (err) => {});
};
