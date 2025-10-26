"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_error_1 = require("../utils/app_error");
const auth_schema_1 = require("../modules/auth/auth.schema");
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token) {
            throw new app_error_1.AppError(400, "Verification token missing");
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Find and update user
        const user = yield auth_schema_1.User_Model.findById(decoded.id);
        if (!user)
            throw new app_error_1.AppError(404, "User not found");
        user.isVerified = true;
        yield user.save();
        res.json({
            success: true,
            message: "Email verified successfully!",
        });
    }
    catch (error) {
        console.error("Verification error:", error);
        res.status(400).json({
            success: false,
            message: "Invalid or expired verification link",
        });
    }
});
exports.verifyEmail = verifyEmail;
