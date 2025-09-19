import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say", ""],
      default: "",
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },
    advance: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    monthlySalary: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    setCommission: {
      type: Boolean,
      default: false,
    },
    commissionPercent: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 100,
    },
    commissionBillThreshold: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    dateOfJoining: {
      type: Date,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export default Staff;


