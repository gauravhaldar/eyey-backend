import Vendor from "../models/vendorModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * @desc    Register a new vendor (status = PENDING, no password)
 * @route   POST /api/vendor/register
 * @access  Public
 */
export const registerVendor = async (req, res) => {
    try {
        const {
            businessName,
            ownerName,
            email,
            mobile,
            gstNumber,
            panNumber,
            address,
            bankDetails,
            productCategory,
        } = req.body;

        // Check if vendor email already exists
        const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
        if (existingVendor) {
            return res.status(400).json({
                message: "A vendor with this email already exists.",
            });
        }

        // Create vendor with PENDING status and no password
        const vendor = await Vendor.create({
            businessName,
            ownerName,
            email: email.toLowerCase(),
            mobile,
            gstNumber: gstNumber.toUpperCase(),
            panNumber: panNumber.toUpperCase(),
            address,
            bankDetails: bankDetails || {},
            productCategory,
            role: "VENDOR",
            status: "PENDING",
            password: null,
        });

        console.log("✅ New vendor registered:", vendor.email);

        res.status(201).json({
            message: "Registration submitted successfully. Await admin approval.",
            vendorId: vendor._id,
        });
    } catch (error) {
        console.error("❌ Vendor registration error:", error);

        // Handle mongoose validation errors
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: messages.join(", ") });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                message: "A vendor with this email already exists.",
            });
        }

        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

/**
 * @desc    Vendor login (only APPROVED vendors)
 * @route   POST /api/vendor/login
 * @access  Public
 */
export const loginVendor = async (req, res) => {
    try {
        const { email: rawEmail, password: rawPassword } = req.body;
        const email = rawEmail?.trim();
        const password = rawPassword?.trim();

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Find vendor by email
        const vendor = await Vendor.findOne({ email: email.toLowerCase() });

        if (!vendor) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Check vendor status
        if (vendor.status === "PENDING") {
            return res.status(403).json({
                message: "Your account is pending admin approval.",
                status: "PENDING",
            });
        }

        if (vendor.status === "REJECTED") {
            return res.status(403).json({
                message: "Your vendor application has been rejected.",
                status: "REJECTED",
                reason: vendor.rejectionReason,
            });
        }

        if (vendor.status === "SUSPENDED") {
            return res.status(403).json({
                message: "Your account has been suspended. Contact support.",
                status: "SUSPENDED",
            });
        }

        if (vendor.status !== "APPROVED") {
            return res.status(403).json({
                message: "Account not approved by admin.",
                status: vendor.status,
            });
        }

        // Check if password exists (it should for approved vendors)
        if (!vendor.password) {
            return res.status(500).json({
                message: "Account setup incomplete. Contact support.",
            });
        }

        // Compare password with bcrypt
        console.log("🔐 Login attempt for:", vendor.email);
        console.log("🔐 Password provided:", password);
        console.log("🔐 Stored hash:", vendor.password);
        const isMatch = await bcrypt.compare(password, vendor.password);
        console.log("🔐 bcrypt compare result:", isMatch);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: vendor._id,
                role: "VENDOR",
                vendorId: vendor._id,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send JWT in HTTP-only cookie
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("vendorToken", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
        });

        console.log("✅ Vendor logged in:", vendor.email);

        res.status(200).json({
            message: "Login successful.",
            vendor: {
                id: vendor._id,
                businessName: vendor.businessName,
                ownerName: vendor.ownerName,
                email: vendor.email,
                role: vendor.role,
                status: vendor.status,
            },
        });
    } catch (error) {
        console.error("❌ Vendor login error:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

/**
 * @desc    Get current vendor profile
 * @route   GET /api/vendor/me
 * @access  Protected (vendorAuth)
 */
export const getCurrentVendor = async (req, res) => {
    try {
        const vendor = req.vendor;
        res.status(200).json({
            id: vendor._id,
            businessName: vendor.businessName,
            ownerName: vendor.ownerName,
            email: vendor.email,
            mobile: vendor.mobile,
            productCategory: vendor.productCategory,
            role: vendor.role,
            status: vendor.status,
        });
    } catch (error) {
        console.error("❌ Get current vendor error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

/**
 * @desc    Vendor logout
 * @route   POST /api/vendor/logout
 * @access  Public
 */
export const logoutVendor = (req, res) => {
    res.cookie("vendorToken", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none",
    });

    res.status(200).json({ message: "Vendor logged out successfully." });
};
