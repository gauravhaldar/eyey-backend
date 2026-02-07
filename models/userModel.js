import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: false, // Optional for Google users
      minlength: 6,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // Only for Google users
    },
    cartData: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
