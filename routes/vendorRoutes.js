import express from "express";
import {
    registerVendor,
    loginVendor,
    getCurrentVendor,
    logoutVendor,
} from "../controllers/vendorController.js";
import { vendorAuth } from "../middleware/vendorAuth.js";

const router = express.Router();

// Public routes
router.post("/register", registerVendor);
router.post("/login", loginVendor);
router.post("/logout", logoutVendor);

// Protected routes (vendor must be logged in)
router.get("/me", vendorAuth, getCurrentVendor);

export default router;
