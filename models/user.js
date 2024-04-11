const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "the name field is required"],
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "the email field is required"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "the password field is required"],
    select: false,
    minlength: 8,
  },
  confirmpassword: {
    type: String,
    required: [true, "the confirm password field is required"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "the passwords are not the same",
    },
    select: false,
    minlength: 8,
  },
  passwordResetToken: String,
  passwordExpiredAt: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmpassword = undefined;

  next();
});
userSchema.post("save", async function () {
  this.password = undefined;
});

userSchema.methods.checkCorrectPassword = async function (
  password,
  userPassword
) {
  return await bcrypt.compare(password, userPassword);
};

userSchema.methods.createPasswordToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordExpiredAt = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);

// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   cart: {
//     items: [
//       {
//         productId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: 'Product',
//           required: true
//         },
//         quantity: {
//           type: Number,
//           required: true
//         }
//       }
//     ]
//   }
// });

// module.exports = mongoose.model('User', userSchema);
