import { AppError } from "../../utils/app_error";
import catchAsync from "../../utils/catch_async";
import { sendResponse } from "../../utils/send_response";
import { auth_service } from "./auth.service";

const sign_up_user = catchAsync(async (req, res) => {

  const result = await auth_service.sign_up_user_into_db(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User created successfully",
    data: result,
  });
});

const login_user = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new AppError(404, "Payload not found");
  }

  const result = await auth_service.login_user_into_db(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User logged in successfully",
    data: result,
  });
});

const change_password = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new AppError(404, "Invalid request: payload is missing");
  }

  await auth_service.change_password_into_db(req.body);

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

export const auth_controller = {
  sign_up_user,
  login_user,
  change_password,
  forgot_password,
  reset_password,
};
