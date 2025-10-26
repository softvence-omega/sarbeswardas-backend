import { ObjectId } from "mongoose";

export type TRole = "ADMIN" | "LEAD" | "MEMBER";
export type TAccountStatus = "ACTIVE" | "INACTIVE";
export type TSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"
  | "none";
export type TLoggedInDevice = {
  deviceId: string;
  userAgent?: string;
  ip?: string;
  loggedInAt?: Date;
};

export type TUser = {
  fullName: string;
  email: string;
  password?: string;
  profileImage?: string;
  subscribedPlanId?: ObjectId;
  hasUsedTrial: boolean;
  loggedInDevices?: TLoggedInDevice[];
  isVerified?: boolean;
  lastOTP?: string;
  isActive?: TAccountStatus;
  isDeleted?: boolean;

  // payment related
  stripeCustomerId: string;
  subscriptionId: string;
  subscriptionStatus: TSubscriptionStatus;
  trialEndsAt: Date;
};
