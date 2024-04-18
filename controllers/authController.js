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
          "this user already exist please use a different email",
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
    // user.password = undefined;
    res.status(201).json({
      status: "success",
      data: {
        user: user,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    if (!email || !password) {
      return next(new AppError("provide email or password", 400));
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
      return next(
        new AppError("Your username or password is not correct", 401)
      );
    }
    user.password = undefined;

    const token = jwt.sign({ id: user._id }, process.env.JTW_SECRET_KEY, {
      expiresIn: process.env.JTW_EXPIRATION_TIME,
      git,
    });
    res.status(200).json({
      token,
      data: {
        user: user,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
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
    return next(new AppError("you are not logged in kindly log in", 401));
  }

  try {
    const decodedToken = await util.promisify(jwt.verify)(
      token,
      process.env.JTW_SECRET_KEY
    );

    const verifiedUser = await User.findById(decodedToken.id);
    if (!verifiedUser) {
      return next(
        new AppError("the user belonging to this token does not exist", 401)
      );
    }
    req.user = verifiedUser;
  } catch (err) {
    if ((err.message = "jwt expired")) {
      return next(new AppError("token expired. please log in again", 401));
    }
    next(new AppError(err.message, 401));
  }

  next();
};

exports.forgotPassword = async function (req, res, next) {
  const email = req.body.email;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return next(new AppError("this user does not exist", 404));
    }
    const resetToken = await user.createPasswordToken();

    await user.save({ validateBeforeSave: false });

    try {
      const resetUrl = `${req.protocol}//${req.get(
        "host"
      )}/api/user/resetPassword/${resetToken}`;
      await sendMail({
        email: user.email,
        subject: "Password Reset (expires in 10 min)",
        text: `please click this link to reset your password\n${resetUrl}\nif you did not perform this action ignore this message`,
      });

      res.status(200).json({
        status: "success",
        message: "email sent successfully",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordExpiredAt = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError(err, 401));
    }
  } catch (err) {
    next(new AppError(err.message, 500));
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
      //   passwordExpiredAt: { $gt: Date.now() },
    });
    if (!user) {
      return next(new AppError("token is invalid or has expired", 404));
    }
    user.password = req.body.password;
    user.confirmpassword = req.body.confirmpassword;
    user.passwordResetToken = undefined;
    user.passwordExpiredAt = undefined;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "password changed sucessfully",
    });
  } catch (err) {
    next(new AppError(err.message));
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
      return next(new AppError("Your previous password is not correct", 400));
    }
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "password updated sucessfully",
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
