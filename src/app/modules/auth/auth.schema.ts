import { model, Schema } from "mongoose";
import { TUser } from "./auth.interface";

const user_schema = new Schema<TUser>({
  firstName: { type: String, required: [true, "First Name is required"] },
  lastName: { type: String, required: [true, "Last Name is required"] },
  phone_number: {
    type: String,
    required: [true, "Phone Number is required"],
    min: [11, "Phone number must be 8 character"],
  },
  email: { type: String, required: [true, "Email is required"], unique: true },
  password: { type: String, required: [true, "Password is required"] },
  role: { type: String, required: true, enum: ["ADMIN", "LEAD", "MEMBER"] },
  isVerified: { type: Boolean, default: false },
  lastOTP: { type: String, required: false },
  isActive: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },
  isDeleted: { type: Boolean, default: false },
});

export const User_Model = model("User", user_schema);
