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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profile_controller = exports.update_profile_image = void 0;
const app_error_1 = require("../../utils/app_error");
const catch_async_1 = __importDefault(require("../../utils/catch_async"));
const cloudinaryUploader_1 = require("../../utils/cloudinaryUploader");
const send_response_1 = require("../../utils/send_response");
const profile_service_1 = require("./profile.service");
const get_profile_info = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    const result = yield profile_service_1.profile_service.get_profile_info_from_db(email);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "User retrieved successfully",
        data: result,
    });
}));
const update_profile_name = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    const { fullName } = req.body;
    if (!email) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access. Email not found.",
        });
    }
    if (!fullName || typeof fullName !== "string") {
        return res.status(400).json({
            success: false,
            message: "Full name is required and must be a string.",
        });
    }
    const result = yield profile_service_1.profile_service.update_profile_name_into_db(email, fullName);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "User name updated successfully",
        data: result,
    });
}));
exports.update_profile_image = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    const file = req.file;
    if (!email)
        throw new app_error_1.AppError(401, "Unauthorized: email not found");
    if (!file)
        throw new app_error_1.AppError(400, "No image file uploaded");
    const uploaded = yield (0, cloudinaryUploader_1.uploadToCloudinary)(file);
    yield profile_service_1.profile_service.update_profile_image_into_db(email, uploaded.url);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Profile image updated successfully",
        data: { imageUrl: uploaded.url },
    });
}));
exports.profile_controller = {
    get_profile_info,
    update_profile_name,
    update_profile_image: exports.update_profile_image,
};
