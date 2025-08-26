import express from "express";
import {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCart,
  clearCart,
  getCartSummary,
} from "../controllers/cartController.js";

const router = express.Router();

// Cart routes
router.post("/add", addToCart); // Add item to cart
router.post("/remove", removeFromCart); // Remove item from cart
router.post("/update", updateCartQuantity); // Update item quantity
router.get("/:userId", getCart); // Get user's cart
router.post("/clear", clearCart); // Clear entire cart
router.get("/summary/:userId", getCartSummary); // Get cart summary

export default router;
