const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
dotenv.config({ path: "./config.env" });

const userRoute = require("./routes/userRoutes");
const adminRoute = require("./routes/adminRoutes");
const shopRoute = require("./routes/shopRoutes");
const AppError = require("./util/AppError");

const app = express();

app.listen(5000);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(express.json());
app.use(multer({ storage: storage, fileFilter: fileFilter }).single("file"));

app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/shop", shopRoute);

app.all("*", (req, res, next) => {
  next(new AppError(`cant find this ${req.originalUrl} on the server`, 404));
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: "fail",
    error: err.message || "error",
  });
});

const connectDatabase = async function () {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@orbangrove.amdejfr.mongodb.net/organgrove?retryWrites=true&w=majority`
    );
    console.log("connected to database");
  } catch (err) {
    console.log("error connecting to database");
    console.log(err);
  }
};

connectDatabase();
