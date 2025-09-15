import express from "express";
import {
  addShippingRule,
  getShippingRules,
  calculateShipping,
  deleteShippingRule,
  deleteShippingRulesByState,
} from "../controllers/shippingController.js";

const router = express.Router();

// Add shipping rule
router.post("/add", addShippingRule);

// Get all shipping rules
router.get("/", getShippingRules);

// Calculate shipping
router.post("/calculate", calculateShipping);
router.delete("/:id", deleteShippingRule);
router.delete("/state/:stateName", deleteShippingRulesByState);

export default router;
