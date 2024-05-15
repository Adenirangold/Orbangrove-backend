const jwt = require("jsonwebtoken");
const util = require("util");
const User = require("../models/user");
const AppError = require("../util/AppError");
const sendMail = require("../util/email");
const crypto = require("crypto");

exports.signup = async (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmpassword = req.body.confirmpassword;

  try {
    const prevUser = await User.findOne({ email: email });
    if (prevUser) {
      return next(
        new AppError(
          "This user already exists, please use a different email",
          401
        )
      );
    }
    const user = await User.create({
      name: name,
      email: email,
      password: password,
      confirmpassword: confirmpassword,
    });

    res.status(201).json({
      status: "Success",
      data: {
        user: user,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      next(
        new AppError("Invalid data provided. Please check your inputs.", 400)
      );
    } else {
      next(new AppError("Internal server error. Please try again later.", 500));
    }
  }
};
exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    if (!email || !password) {
      return next(new AppError("Please provide both email and password.", 400));
    }
    const user = await User.findOne({ email: email }).select("+password");
    let correctPassword;
    if (user) {
      correctPassword = await user.checkCorrectPassword(
        password,
        user.password
      );
    }

    if (!user || !correctPassword) {
      return next(new AppError("Incorrect email or password.", 401));
    }
    user.password = undefined;

    const token = jwt.sign({ id: user._id }, process.env.JTW_SECRET_KEY, {
      expiresIn: process.env.JTW_EXPIRATION_TIME,
    });

    res.status(200).json({
      status: "Success",
      token,
      data: {
        user: user,
      },
    });
  } catch (err) {
    next(new AppError("Internal server error. Please try again later.", 500));
  }
};

exports.protectRoutes = async function (req, res, next) {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please log in to access this route.",
        401
      )
    );
  }

  try {
    const decodedToken = await util.promisify(jwt.verify)(
      token,
      process.env.JTW_SECRET_KEY
    );

    const verifiedUser = await User.findById(decodedToken.id);
    if (!verifiedUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }
    req.user = verifiedUser;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    } else if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    } else {
      return next(
        new AppError("Failed to authenticate token. Please try again.", 401)
      );
    }
  }
};

exports.forgotPassword = async function (req, res, next) {
  const email = req.body.email;
  if (!email) {
    return next(new AppError("Please provide your email address.", 400));
  }
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return next(
        new AppError("There is no user with that email address.", 404)
      );
    }
    const resetToken = await user.createPasswordToken();

    await user.save({ validateBeforeSave: false });

    try {
      const resetUrl = `${req.protocol}//${req.get(
        "host"
      )}/api/user/resetPassword/${resetToken}`;
      await sendMail({
        email: user.email,
        subject: "Password Reset (Expires In 10 Min)",
        text: `Please click the link below to reset your password\n${resetUrl}\nIf you did not request this, please ignore this email`,
      });

      res.status(200).json({
        status: "Success",
        message: "Email sent successfully.",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordExpiredAt = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          "There was an error sending the email. Try again later.",
          500
        )
      );
    }
  } catch (err) {
    next(new AppError("Something went wrong. Please try again later.", 500));
  }
};

exports.resetPassword = async function (req, res, next) {
  try {
    const token = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: token,
      passwordExpiredAt: { $gt: Date.now() },
    });
    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.confirmpassword = req.body.confirmpassword;
    user.passwordResetToken = undefined;
    user.passwordExpiredAt = undefined;
    await user.save();
    res.status(200).json({
      status: "Success",
      message: "Password changed sucessfully",
    });
  } catch (err) {
    next(
      new AppError("Failed to reset password. Please try again later.", 500)
    );
  }
};

exports.updatePassword = async function (req, res, next) {
  try {
    const userId = req.user._id;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const user = await User.findById({ _id: userId }).select("+password");
    const confirmOldPassword = await user.checkCorrectPassword(
      oldPassword,
      user.password
    );

    if (!confirmOldPassword) {
      return next(new AppError("Your previous password is incorrect.", 400));
    }
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "Success",
      message: "Password updated sucessfully",
    });
  } catch (err) {
    next(
      new AppError("Failed to update password. Please try again later.", 500)
    );
  }
};
