import express from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/userController.js";
import { applyCoupon } from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getCurrentUser);

// Coupon routes for users
router.post("/coupons/apply", applyCoupon);

export default router;
