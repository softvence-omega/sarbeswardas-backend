"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User_Model = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
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
        // required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
    },
    profileImage: {
        type: String,
        default: "",
    },
    subscribedPlanId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Plan", // optional, change if you have a Plan model
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
        default: true,
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
}, {
    timestamps: true,
    versionKey: false,
});
exports.User_Model = (0, mongoose_1.model)("User", userSchema);
