import { AppError } from "../../utils/app_error";
import catchAsync from "../../utils/catch_async";
import { sendResponse } from "../../utils/send_response";
import { auth_service } from "./auth.service";

const sign_up_user = catchAsync(async (req, res) => {
  const result = await auth_service.sign_up_user_into_db(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User register successfully",
    // message: "Check your email for OTP",
    data: result,
  });
});

const verify_email = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError(404, "Email or OTP not found!!");
  }
  const payload = { email, otp };

  const result = await auth_service.verify_email_into_db(payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "OTP verified successfully",
    data: result,
  });
});

const login_user = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new AppError(404, "Payload not found");
  }

  const result = await auth_service.login_user_into_db(req, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User logged in successfully",
    data: result,
  });
});

const change_password = catchAsync(async (req, res) => {
  const email = req.user?.email;
  if (!req.body) {
    throw new AppError(404, "Invalid request: payload is missing");
  }

  if (req.body.oldPassword === req.body.newPassword) {
    throw new AppError(409, "oldPassword and newPassword must be different");
  }
  const payload = {
    email,
    ...req.body,
  };

  await auth_service.change_password_into_db(payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password changed successfully",
  });
});

const forgot_password = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new AppError(404, "Invalid request: payload is missing");
  }

  const result = await auth_service.forgot_password(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    // message: result,
    data: result,
  });
});

const reset_password = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await auth_service.reset_password_into_db(email, otp, newPassword);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password reset successfully",
  });
});

const logged_out_all_device = catchAsync(async (req, res) => {
  const email = req.user?.email;
  if (!email) {
    throw new AppError(404, "Email not found from token");
  }

  await auth_service.logged_out_all_device_from_db(email);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All device logged out",
  });
});

const login_user_with_google = catchAsync(async (req, res) => {
  const result = await auth_service.login_user_with_google_from_db(req, req?.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Login Successful.",
    data: result,
  });
});

const delete_account = catchAsync(async (req, res) => {
  const userId = req.user?.userId;

  await auth_service.delete_account_from_db(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Account deleted successfully",
  });
});

export const auth_controller = {
  sign_up_user,
  verify_email,
  login_user,
  change_password,
  forgot_password,
  reset_password,
  logged_out_all_device,
  login_user_with_google,
  delete_account,
};
