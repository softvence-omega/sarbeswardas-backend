"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoute = void 0;
const express_1 = require("express");
const profile_controller_1 = require("./profile.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const cloudinaryUploader_1 = require("../../utils/cloudinaryUploader");
const router = (0, express_1.Router)();
router.get("/", (0, auth_1.default)(), profile_controller_1.profile_controller.get_profile_info);
router.patch("/update-profile-name", (0, auth_1.default)(), profile_controller_1.profile_controller.update_profile_name);
router.patch("/update-profile-image", (0, auth_1.default)(), cloudinaryUploader_1.upload.single("image"), profile_controller_1.profile_controller.update_profile_image);
exports.profileRoute = router;
