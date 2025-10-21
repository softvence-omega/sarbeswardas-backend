import { Schema, model } from "mongoose";

const planSchema = new Schema(
  {
    name: { type: String, required: true },
    priceId: { type: String, required: true }, // Stripe price ID
    price: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    features: [String],
  },
  { timestamps: true }
);

export const Plan_Model = model("Plan", planSchema);
