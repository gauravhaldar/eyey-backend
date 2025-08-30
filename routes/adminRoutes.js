import express from "express";
import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
  getUsers,
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
router.get("/customers", getUsers);

// Coupon routes
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.post("/coupons/apply", applyCoupon);
router.post("/coupons/use/:id", useCoupon);
router.get("/coupons/analytics", getCouponAnalytics);

// Order management routes
router.get("/orders", getAllOrders);
router.put("/orders/:orderId/status", updateOrderStatus);
router.delete("/orders/:orderId", deleteOrder);

export default router;
