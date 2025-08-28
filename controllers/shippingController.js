import Shipping from "../models/shippingModel.js";

// Add new shipping rule
export const addShippingRule = async (req, res) => {
  try {
    const { zipCode, state, stateCode, gstCode, charges, priceLessThan } =
      req.body;

    const newShipping = new Shipping({
      zipCode,
      state,
      stateCode,
      gstCode,
      charges,
      priceLessThan,
    });
    await newShipping.save();

    res
      .status(201)
      .json({ message: "Shipping rule added successfully", data: newShipping });
  } catch (err) {
    console.error("Error adding shipping rule:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all shipping rules
export const getShippingRules = async (req, res) => {
  try {
    const rules = await Shipping.find();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a shipping rule
export const deleteShippingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRule = await Shipping.findByIdAndDelete(id);

    if (!deletedRule) {
      return res.status(404).json({ message: "Shipping rule not found" });
    }

    res.json({ message: "Shipping rule deleted successfully" });
  } catch (err) {
    console.error("Error deleting shipping rule:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete shipping rules by state
export const deleteShippingRulesByState = async (req, res) => {
  try {
    const { stateName } = req.params;
    const deleteResult = await Shipping.deleteMany({ state: stateName });

    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No shipping rules found for this state" });
    }

    res.json({
      message: `${deleteResult.deletedCount} shipping rules for state ${stateName} deleted successfully `,
    });
  } catch (err) {
    console.error("Error deleting shipping rules by state:", err);
    res.status(500).json({ error: err.message });
  }
};

// Calculate shipping charge based on zip code
export const calculateShipping = async (req, res) => {
  try {
    const { zipCode } = req.body;

    const shippingRule = await Shipping.findOne({ zipCode });

    if (!shippingRule) {
      return res
        .status(404)
        .json({ message: "No shipping rule found for this zip code" });
    }

    res.json({
      zipCode,
      state: shippingRule.state,
      stateCode: shippingRule.stateCode,
      gstCode: shippingRule.gstCode,
      finalCharge: shippingRule.charges,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
