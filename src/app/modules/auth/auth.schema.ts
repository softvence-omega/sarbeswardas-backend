import { Schema, model } from "mongoose";
import { TUser } from "./auth.interface";

const userSchema = new Schema<TUser>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    subscribedPlanId: {
      type: Schema.Types.ObjectId,
      ref: "Plan", // optional, change if you have a Plan model
    },
    hasUsedTrial: {
      type: Boolean,
      default: false,
    },
    loggedInDevices: [
      {
        deviceId: { type: String, required: true },
        userAgent: String,
        ip: String,
        loggedInAt: { type: Date, default: Date.now },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastOTP: {
      type: String,
      default: "",
    },
    isActive: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // payment related
    stripeCustomerId: { type: String },
    subscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
        "none",
      ],
      default: "none",
    },
    trialEndsAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User_Model = model<TUser>("User", userSchema);
