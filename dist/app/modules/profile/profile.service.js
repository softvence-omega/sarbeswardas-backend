"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profile_service = void 0;
const app_error_1 = require("../../utils/app_error");
const auth_schema_1 = require("../auth/auth.schema");
const get_profile_info_from_db = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_schema_1.User_Model.findOne({ email, isDeleted: false }).select("_id fullName email profileImage isVerified createdAt updatedAt");
    if (!user) {
        throw new app_error_1.AppError(404, "User not found");
    }
    return user;
});
const update_profile_name_into_db = (email, fullName) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedUser = yield auth_schema_1.User_Model.findOneAndUpdate({ email }, { fullName }, { new: true, projection: "fullName" });
    if (!updatedUser) {
        throw new app_error_1.AppError(404, "User not found or update failed");
    }
    return updatedUser;
});
const update_profile_image_into_db = (email, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedUser = yield auth_schema_1.User_Model.findOneAndUpdate({ email }, { profileImage: imageUrl }, { new: true });
    if (!updatedUser) {
        throw new app_error_1.AppError(404, "User not found or failed to update profile image");
    }
    return updatedUser;
});
exports.profile_service = {
    get_profile_info_from_db,
    update_profile_name_into_db,
    update_profile_image_into_db,
};
