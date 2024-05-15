const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
dotenv.config({ path: "./config.env" });
const session = require("express-session");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const userRoute = require("./routes/userRoutes");
const adminRoute = require("./routes/adminRoutes");
const shopRoute = require("./routes/shopRoutes");
const cartRoute = require("./routes/cartRoutes");
const AppError = require("./util/AppError");
const deleteExpiredCarts = require("./util/cleanUp");

const app = express();

app.listen(5000);

app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
);

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

setInterval(deleteExpiredCarts, 24 * 60 * 60 * 1000); // Every day

app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/shop", shopRoute);
app.use("/api/cart", cartRoute);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
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
    process.exit(1);
  }
};

connectDatabase();
