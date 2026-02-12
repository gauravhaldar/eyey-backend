import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: [true, "Business name is required"],
            trim: true,
        },
        ownerName: {
            type: String,
            required: [true, "Owner name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
        },
        gstNumber: {
            type: String,
            required: [true, "GST number is required"],
            trim: true,
            uppercase: true,
            match: [
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                "Please enter a valid 15-digit GST number",
            ],
        },
        panNumber: {
            type: String,
            required: [true, "PAN number is required"],
            trim: true,
            uppercase: true,
            match: [
                /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                "Please enter a valid 10-character PAN number",
            ],
        },
        address: {
            type: String,
            required: [true, "Business address is required"],
            trim: true,
        },
        bankDetails: {
            accountHolderName: { type: String, trim: true },
            bankName: { type: String, trim: true },
            ifscCode: { type: String, trim: true, uppercase: true },
            accountNumber: { type: String, trim: true },
            upiId: { type: String, trim: true },
        },
        productCategory: {
            type: String,
            required: [true, "Product category is required"],
            trim: true,
        },
        role: {
            type: String,
            default: "VENDOR",
            enum: ["VENDOR"],
        },
        status: {
            type: String,
            default: "PENDING",
            enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
        },
        password: {
            type: String,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
