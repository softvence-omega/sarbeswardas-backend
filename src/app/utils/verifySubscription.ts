import { NextFunction, Request, Response } from "express";
import { User_Model } from "../modules/auth/auth.schema";

export const verifySubscription = async (req: Request, res: Response, next: NextFunction) => {
  const user = await User_Model.findById(req.user?.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const isTrial = user.trialEndsAt && user.trialEndsAt > new Date();
  const isActive = ["active", "trialing"].includes(user.subscriptionStatus);

  if (isTrial || isActive) {
    next();
  } else {
    res.status(403).json({
      message: "Subscription required. Please upgrade your plan.",
    });
  }
};
