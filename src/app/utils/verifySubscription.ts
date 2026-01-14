import { NextFunction, Request, Response } from "express";
import { User_Model } from "../modules/auth/auth.schema";

export const verifySubscription = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User_Model.findById(req.user?.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isTrialEffective = user.subscriptionStatus === "trialing" && user.trialEndsAt && user.trialEndsAt > new Date();
      const isSubscribed = user.subscriptionStatus === "active";

      const isCanceled = user.subscriptionStatus === "canceled";
      if (!isCanceled && (isTrialEffective || isSubscribed)) {
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
