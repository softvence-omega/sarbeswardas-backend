import { ObjectId } from "mongoose";

export type TRole = "ADMIN" | "LEAD" | "MEMBER";
export type TAccountStatus = "ACTIVE" | "INACTIVE";
export type TLoggedInDevice = {
  deviceId: string;
  userAgent?: string;
  ip?: string;
  loggedInAt?: Date;
};

export type TUser = {
  fullName: string;
  email: string;
  password: string;
  profileImage?: string;
  subscribedPlanId?: ObjectId;
  loggedInDevices?: TLoggedInDevice[];
  isVerified?: boolean;
  lastOTP?: string;
  isActive?: TAccountStatus;
  isDeleted?: boolean;
};
