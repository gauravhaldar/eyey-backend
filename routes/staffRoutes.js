import express from "express";
import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Admin-protected routes
router.post("/", adminAuth, createStaff);
router.get("/", adminAuth, getStaff);
router.get("/:id", adminAuth, getStaffById);
router.put("/:id", adminAuth, updateStaff);
router.delete("/:id", adminAuth, deleteStaff);

export default router;


