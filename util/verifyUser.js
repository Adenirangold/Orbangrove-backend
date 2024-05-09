const jwt = require("jsonwebtoken");
const util = require("util");
const User = require("../models/user");
const AppError = require("./AppError");

exports.verifyUser = async function (req, res, next) {
  try {
    // Check for JWT Token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = await util.promisify(jwt.verify)(
        token,
        process.env.JTW_SECRET_KEY
      );

      // Verify decoded token
      if (!decodedToken) {
        return next(new AppError("Invalid token", 401));
      }

      // Retrieve user from database
      const verifiedUser = await User.findById(decodedToken.id);
      if (!verifiedUser) {
        return next(new AppError("User not found", 401));
      }

      // Attach user to request object
      req.user = verifiedUser;
    } else {
      // Generate random session ID if no JWT token is provided
      if (!req.session.sessionId) {
        const randomString = Math.random().toString(36).substring(2, 12);
        req.session.sessionId = randomString;
      }
    }
    next();
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
