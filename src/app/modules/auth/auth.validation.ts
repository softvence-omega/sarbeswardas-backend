import { email, z } from "zod";

export const register_schema = z.object({});

export const login_schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string("Password is required"),
});

export const change_password_schema = z.object({
  oldPassword: z.string("oldPassword is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});
