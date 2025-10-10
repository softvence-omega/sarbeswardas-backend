export type TRole = "ADMIN" | "LEAD" | "MEMBER";
export type TAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type TUser = {
  firstName: string;
  lastName: string;
  phone_number: string;
  email: string;
  password: string;
  role: TRole;
  isVerified?: boolean;
  lastOTP?: string;
  isActive?: TAccountStatus;
  isDeleted?: boolean;
};
