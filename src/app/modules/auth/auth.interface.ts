import { ObjectId } from "mongoose";

export type TRole = "ADMIN" | "LEAD" | "MEMBER";
export type TAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type TUser = {
  fullName: string;
  email: string;
  password: string;
  profileImage?: string;
  subscribedPlanId?: ObjectId;
  loggedInDevice?: string[];
  isVerified?: boolean;
  lastOTP?: string;
  isActive?: TAccountStatus;
  isDeleted?: boolean;
};
