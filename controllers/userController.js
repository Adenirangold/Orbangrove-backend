const User = require("../models/user");
const AppError = require("../util/AppError");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: "success",
      data: {
        users: users,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
exports.getUser = async (req, res, next) => {
  const userId = req.params.id;
  try {
    const user = await User.findById({ _id: userId });
    if (!user) {
      return next(new AppError("no user exists with this id", 400));
    }

    res.status(200).json({
      status: "success",
      data: {
        user: user,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
