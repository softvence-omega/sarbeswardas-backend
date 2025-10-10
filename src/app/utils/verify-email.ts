import jwt from "jsonwebtoken";
// import { User } from "../models/user.model";
import { Request, Response } from "express";
import { AppError } from "../utils/app_error";
import { User_Model } from "../modules/auth/auth.schema";

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new AppError(400, "Verification token missing");
    }

    // Verify token
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { id: string };

    // Find and update user
    const user = await User_Model.findById(decoded.id);

    if (!user) throw new AppError(404, "User not found");

    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(400).json({
      success: false,
      message: "Invalid or expired verification link",
    });
  }
};
