import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js"; // Import the configured multer upload middleware

const router = express.Router();

// Admin routes
router
  .route("/") // Changed from "/admin/products" to "/"
  .post(adminAuth, upload.array("images", 4), createProduct) // Re-added adminAuth and removed temporary console.log
  .get(getProducts); // Restored original getProducts

router
  .route("/:id") // Changed from "/admin/products/:id" to "/:id"
  .get(getProductById)
  .put(adminAuth, upload.array("images", 4), updateProduct)
  .delete(adminAuth, deleteProduct);

export default router;
