import { NextFunction, Request, Response } from "express";
import { User_Model } from "../modules/auth/auth.schema";

export const verifySubscription = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User_Model.findById(req.user?.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isTrial = user.trialEndsAt && user.trialEndsAt > new Date();
      const isActive = ["active", "trialing"].includes(user.subscriptionStatus);

      // --- Option 1: Standard logic (Trial continues even if canceled) ---
      // if (isTrial || isActive) {
      //   return next();
      // }

      // --- Option 2: Immediate stop logic (Blocks if canceled, even in trial) ---
      
      const isCanceled = user.subscriptionStatus === "canceled";
      if (!isCanceled && (isTrial || isActive)) {
        return next();
      }
      
      return res.status(403).json({
        message: "Subscription required. Please upgrade your plan.",
      });
    } catch (error) {
      next(error);
    }
  };
};
