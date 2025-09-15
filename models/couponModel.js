import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    minValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxValue: {
      type: Number,
      required: true,
      min: 0,
    },
    usageLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: false,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

// Virtual for remaining uses
couponSchema.virtual("remainingUses").get(function () {
  return this.usageLimit - this.usedCount;
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
