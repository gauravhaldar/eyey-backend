import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModel.js";

export const vendorAuth = async (req, res, next) => {
    const token = req.cookies.vendorToken;

    if (!token) {
        return res.status(401).json({ message: "Not authenticated. Please login." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify the role is VENDOR
        if (decoded.role !== "VENDOR") {
            return res.status(403).json({ message: "Access denied. Vendor only." });
        }

        const vendor = await Vendor.findById(decoded.id).select("-password");

        if (!vendor) {
            return res.status(401).json({ message: "Vendor not found." });
        }

        // Block suspended vendors
        if (vendor.status === "SUSPENDED") {
            return res.status(403).json({
                message: "Your account has been suspended. Contact support.",
                status: "SUSPENDED",
            });
        }

        req.vendor = vendor;
        next();
    } catch (error) {
        console.error("Vendor auth error:", error);
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};
