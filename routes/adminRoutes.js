import express from "express";
import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
  getUsers,
  deleteUser,
  generateInvoice,
  getInvoiceData,
} from "../controllers/adminController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  useCoupon,
  getCouponAnalytics,
} from "../controllers/couponController.js";
import {
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Public route
router.post("/login", adminLogin);

// Protected route
router.get("/me", adminAuth, getCurrentAdmin);

// ✅ Logout route should NOT use adminAuth middleware
router.post("/logout", adminLogout);

//get user info
router.get("/customers", adminAuth, getUsers);
router.delete("/customers/:id", deleteUser); // Remove auth temporarily for testing
router.get("/test", (req, res) =>
  res.json({ message: "Admin routes working" })
); // Test route

// Coupon routes (temporarily remove auth for debugging)
router.get("/coupons", getCoupons);
router.post("/coupons", (req, res, next) => {
  console.log("🔵 Admin coupon route hit - body:", req.body);
  next();
}, createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.post("/coupons/apply", applyCoupon);
router.post("/coupons/use/:id", useCoupon);
router.get("/coupons/analytics", adminAuth, getCouponAnalytics);

// Debug test route
router.post("/coupons/test", async (req, res) => {
  console.log("Test route - Raw body:", req.body);
  
  try {
    // Test creating a coupon with startDate directly
    const testCoupon = new (await import("../models/couponModel.js")).default({
      name: "DirectTest",
      code: "DIRECTTEST123",
      type: "percentage",
      amount: 10,
      minValue: 100,
      maxValue: 1000,
      usageLimit: 5,
      startDate: new Date("2024-12-15"),
      expiryDate: new Date("2024-12-25"),
    });
    
    const saved = await testCoupon.save();
    console.log("Direct test coupon saved:", saved);
    
    res.json({ success: true, received: req.body, directTest: saved });
  } catch (error) {
    console.error("Direct test error:", error);
    res.json({ success: false, error: error.message });
  }
});

// Order management routes
router.get("/orders", getAllOrders);
router.put("/orders/:orderId/status", updateOrderStatus);
router.delete("/orders/:orderId", deleteOrder);

// Invoice routes
router.get("/orders/:orderId/invoice", adminAuth, generateInvoice);
router.get("/invoice/:invoiceId", getInvoiceData); // Public route for QR verification

export default router;
