import { Router } from "express";
import { auth_controller } from "./auth.controller";
import RequestValidator from "../../middlewares/request_validator";
import { change_password_schema, login_schema } from "./auth.validation";
import { verifyEmail } from "../../utils/verify-email";

const router = Router();

router.post("/register", auth_controller.sign_up_user);
router.post("/login", RequestValidator(login_schema), auth_controller.login_user);
router.patch(
  "/change-password",
  RequestValidator(change_password_schema),
  auth_controller.change_password
);

router.post("/forgot-password", auth_controller.forgot_password);
router.post("/reset-password", auth_controller.reset_password);

router.get("/verify-email", verifyEmail);

export const authRouter = router;
