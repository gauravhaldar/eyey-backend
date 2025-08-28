import mongoose from "mongoose";

const shippingSchema = new mongoose.Schema({
  zipCode: { type: String, required: true },
  state: { type: String, required: true },
  stateCode: { type: String, required: true },
  gstCode: { type: String, required: true },
  charges: { type: Number, required: true }, // base shipping charge
  priceLessThan: { type: Number, required: true },
});

const Shipping = mongoose.model("Shipping", shippingSchema);
export default Shipping;
