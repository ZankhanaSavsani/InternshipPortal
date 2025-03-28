const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const comparePassword = require("../utils/passwordUtils"); // Import the function

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate password and hash it
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is modified

  // Hash the password before saving
  this.password = await bcrypt.hash(this.password, 10);

  next();
});

adminSchema.methods.comparePassword = comparePassword;

module.exports = mongoose.model("Admin", adminSchema);
