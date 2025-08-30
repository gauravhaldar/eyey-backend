import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// User order routes
router.post("/create", protect, createOrder);
router.get("/my-orders", protect, getUserOrders);
router.get("/:orderId", protect, getOrderById);

export default router;
