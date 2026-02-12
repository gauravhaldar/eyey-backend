import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Vendor from "../models/vendorModel.js";
import InvoiceGenerator from "../utils/invoiceGenerator.js";
import SimpleInvoiceGenerator from "../utils/simpleInvoiceGenerator.js";
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from "../utils/emailService.js";

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

// Generate JWT token
const generateToken = () => {
  return jwt.sign(
    { email: ADMIN_EMAIL, id: "admin_user_id" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Admin login
export const adminLogin = (req, res) => {
  const { email, password } = req.body;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (
    email.trim() === ADMIN_EMAIL.trim() &&
    password.trim() === ADMIN_PASSWORD.trim()
  ) {
    const token = jwt.sign(
      { email: ADMIN_EMAIL, id: "admin_user_id" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("adminToken", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: true, // ✅ Set to true for SameSite=None, and works on localhost
      sameSite: "none", // ✅ Required for cross-site cookies with secure:true
    });

    return res.status(200).json({ message: "Admin logged in successfully" });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
};

// Get current admin
export const getCurrentAdmin = (req, res) => {
  const token = req.cookies.adminToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ email: decoded.email });
  } catch (error) {
    console.error("JWT verification error in getCurrentAdmin:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin logout
export const adminLogout = (req, res) => {
  res.cookie("adminToken", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: true, // ✅ Same as above
    sameSite: "none", // ✅ Same as above
  });

  return res.status(200).json({ message: "Admin logged out successfully" });
};

//get all users info
export const getUsers = async (req, res) => {
  try {
    console.log("🔍 Fetching users...");
    const users = await User.find({}, "name email createdAt"); // Select name, email, and createdAt
    console.log(`👥 Found users: ${users.length}`);
    console.log(
      "📅 Sample user with dates:",
      JSON.stringify(
        {
          name: users[0]?.name,
          email: users[0]?.email,
          createdAt: users[0]?.createdAt,
          createdAtType: typeof users[0]?.createdAt,
        },
        null,
        2
      )
    );
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    console.log("Delete user request received for ID:", req.params.id);
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      console.log("User not found with ID:", id);
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);
    console.log("User deleted successfully:", id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate and download invoice for an order
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("🧾 Generating invoice for order:", orderId);

    // Find the order
    const order = await Order.findById(orderId).populate("user", "name email");

    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("✅ Order found, generating invoice...");

    // Generate invoice using simple generator (fallback to complex one if needed)
    let invoiceResult;
    try {
      invoiceResult = await SimpleInvoiceGenerator.generateInvoice(order);
    } catch (simpleError) {
      console.warn(
        "Simple invoice generation failed, trying complex generator:",
        simpleError.message
      );
      invoiceResult = await InvoiceGenerator.generateInvoice(order);
    }

    const { pdfBuffer, invoiceId } = invoiceResult;

    console.log("✅ Invoice generated successfully, invoice ID:", invoiceId);

    // Update order with invoice info if it was newly generated
    if (!order.invoice?.invoiceId) {
      await Order.findByIdAndUpdate(orderId, {
        "invoice.invoiceId": invoiceId,
        "invoice.generatedDate": new Date(),
        "invoice.dueDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "invoice.paymentStatus":
          order.paymentMethod === "cash_on_delivery" ? "pending" : "paid",
      });
      console.log("✅ Order updated with invoice info");
    }

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoiceId}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);

    console.log("✅ Invoice downloaded successfully for order:", orderId);
  } catch (error) {
    console.error("❌ Error generating invoice:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get invoice data for QR code verification
export const getInvoiceData = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    console.log("🔍 Fetching invoice data for:", invoiceId);

    // Find order by invoice ID
    const order = await Order.findOne({ "invoice.invoiceId": invoiceId })
      .populate("user", "name email")
      .select(
        "orderId orderDate orderSummary status invoice shippingAddress paymentMethod"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Return invoice data for QR verification
    const invoiceData = {
      invoiceId: order.invoice.invoiceId,
      orderId: order.orderId,
      amount: order.orderSummary.total,
      date: order.invoice.generatedDate,
      customer: order.shippingAddress.name,
      email: order.shippingAddress.email,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.invoice.paymentStatus,
      orderDate: order.orderDate,
    };

    res.json({
      success: true,
      data: invoiceData,
    });

    console.log("✅ Invoice data retrieved successfully");
  } catch (error) {
    console.error("❌ Error fetching invoice data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice data",
      error: error.message,
    });
  }
};

// ==========================================
// VENDOR MANAGEMENT
// ==========================================

/**
 * @desc    Get all vendors (with optional status filter)
 * @route   GET /api/admin/vendors
 * @access  Admin only
 */
export const getVendors = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: status.toUpperCase() } : {};

    const vendors = await Vendor.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    console.log(`📋 Fetched ${vendors.length} vendors (filter: ${status || "ALL"})`);
    res.status(200).json(vendors);
  } catch (error) {
    console.error("❌ Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors." });
  }
};

/**
 * @desc    Approve a vendor — generate password, hash, send email
 * @route   PATCH /api/admin/vendors/:id/approve
 * @access  Admin only
 */
export const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    if (vendor.status === "APPROVED") {
      return res.status(400).json({ message: "Vendor is already approved." });
    }

    // Generate random password (10 characters)
    const plainPassword = crypto.randomBytes(5).toString("hex");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Update vendor
    vendor.status = "APPROVED";
    vendor.password = hashedPassword;
    vendor.rejectionReason = null;
    await vendor.save();

    // Send approval email with credentials
    const emailResult = await sendVendorApprovalEmail(vendor, plainPassword);

    console.log(`✅ Vendor approved: ${vendor.email} (password emailed: ${emailResult.success})`);

    res.status(200).json({
      message: "Vendor approved successfully. Credentials sent to vendor email.",
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("❌ Error approving vendor:", error);
    res.status(500).json({ message: "Failed to approve vendor." });
  }
};

/**
 * @desc    Reject a vendor
 * @route   PATCH /api/admin/vendors/:id/reject
 * @access  Admin only
 */
export const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    vendor.status = "REJECTED";
    vendor.rejectionReason = reason || "Application did not meet requirements.";
    vendor.password = null;
    await vendor.save();

    // Send rejection email
    await sendVendorRejectionEmail(vendor, vendor.rejectionReason);

    console.log(`❌ Vendor rejected: ${vendor.email}`);

    res.status(200).json({
      message: "Vendor rejected successfully.",
    });
  } catch (error) {
    console.error("❌ Error rejecting vendor:", error);
    res.status(500).json({ message: "Failed to reject vendor." });
  }
};

/**
 * @desc    Suspend a vendor
 * @route   PATCH /api/admin/vendors/:id/suspend
 * @access  Admin only
 */
export const suspendVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    vendor.status = "SUSPENDED";
    await vendor.save();

    console.log(`⛔ Vendor suspended: ${vendor.email}`);

    res.status(200).json({
      message: "Vendor suspended successfully.",
    });
  } catch (error) {
    console.error("❌ Error suspending vendor:", error);
    res.status(500).json({ message: "Failed to suspend vendor." });
  }
};

/**
 * @desc    Resend credentials email to an approved vendor (generates new password)
 * @route   POST /api/admin/vendors/:id/resend-email
 * @access  Admin only
 */
export const resendVendorEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    if (vendor.status !== "APPROVED") {
      return res.status(400).json({ message: "Can only resend email to approved vendors." });
    }

    // Generate a new password
    const plainPassword = crypto.randomBytes(5).toString("hex");

    // Hash and save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    vendor.password = hashedPassword;
    await vendor.save();

    // Send email
    const emailResult = await sendVendorApprovalEmail(vendor, plainPassword);

    console.log(`📧 Resent credentials to ${vendor.email} (success: ${emailResult.success})`);

    res.status(200).json({
      message: "New credentials generated and emailed to vendor.",
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("❌ Error resending vendor email:", error);
    res.status(500).json({ message: "Failed to resend email." });
  }
};
