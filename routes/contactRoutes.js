import express from "express";
import { submitContact } from "../controllers/contactController.js";

const router = express.Router();

// Public route for contact form submission
router.post("/submit", submitContact);

export default router;
