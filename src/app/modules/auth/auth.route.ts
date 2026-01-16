import { Router } from "express";
import { auth_controller } from "./auth.controller";
import RequestValidator from "../../middlewares/request_validator";
import { change_password_schema, login_schema, resend_otp_schema } from "./auth.validation";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/register", auth_controller.sign_up_user);
router.post("/login", RequestValidator(login_schema), auth_controller.login_user);
router.post("/verify-email", auth_controller.verify_email);
router.patch(
  "/change-password",
  auth(),
  RequestValidator(change_password_schema),
  auth_controller.change_password
);

router.post("/forgot-password", auth_controller.forgot_password);
router.post("/reset-password", auth_controller.reset_password);
router.post(
  "/resend-otp",
  RequestValidator(resend_otp_schema),
  auth_controller.resend_otp
);
// router.get("/verify-email", verifyEmail);
router.post("/log-out-all-device", auth(), auth_controller.logged_out_all_device);
router.post("/login-with-google", auth_controller.login_user_with_google);
router.patch("/delete-account", auth(), auth_controller.delete_account);

export const authRouter = router;
