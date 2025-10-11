import { model, Schema } from "mongoose";
import { TUser } from "./auth.interface";

const user_schema = new Schema<TUser>({
  fullName: { type: String, required: [true, "First Name is required"] },
  email: { type: String, required: [true, "Email is required"], unique: true },
  password: { type: String, required: [true, "Password is required"] },
  isVerified: { type: Boolean, default: true },
  lastOTP: { type: String, required: false },
  isActive: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },
  isDeleted: { type: Boolean, default: false },
});

export const User_Model = model("User", user_schema);
