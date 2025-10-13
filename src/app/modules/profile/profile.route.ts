import { Router } from "express";
import { profile_controller } from "./profile.controller";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/cloudinaryUploader";

const router = Router();

router.get("/", auth(), profile_controller.get_profile_info);
router.patch("/update-profile-name", auth(), profile_controller.update_profile_name);
router.patch(
  "/update-profile-image",
  auth(),
  upload.single("image"),
  profile_controller.update_profile_image
);

export const profileRoute = router;
