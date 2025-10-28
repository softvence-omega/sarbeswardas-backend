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
exports.auth_controller = void 0;
const app_error_1 = require("../../utils/app_error");
const catch_async_1 = __importDefault(require("../../utils/catch_async"));
const send_response_1 = require("../../utils/send_response");
const auth_service_1 = require("./auth.service");
const sign_up_user = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.auth_service.sign_up_user_into_db(req.body);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Check your email for OTP",
        data: result,
    });
}));
const verify_email = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new app_error_1.AppError(404, "Email or OTP not found!!");
    }
    const payload = { email, otp };
    const result = yield auth_service_1.auth_service.verify_email_into_db(payload);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "OTP verified successfully",
        data: result,
    });
}));
const login_user = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body) {
        throw new app_error_1.AppError(404, "Payload not found");
    }
    const result = yield auth_service_1.auth_service.login_user_into_db(req, req.body);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "User logged in successfully",
        data: result,
    });
}));
const change_password = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    if (!req.body) {
        throw new app_error_1.AppError(404, "Invalid request: payload is missing");
    }
    if (req.body.oldPassword === req.body.newPassword) {
        throw new app_error_1.AppError(409, "oldPassword and newPassword must be different");
    }
    const payload = Object.assign({ email }, req.body);
    yield auth_service_1.auth_service.change_password_into_db(payload);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Password changed successfully",
    });
}));
const forgot_password = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body) {
        throw new app_error_1.AppError(404, "Invalid request: payload is missing");
    }
    const result = yield auth_service_1.auth_service.forgot_password(req.body);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        // message: result,
        data: result,
    });
}));
const reset_password = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp, newPassword } = req.body;
    yield auth_service_1.auth_service.reset_password_into_db(email, otp, newPassword);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Password reset successfully",
    });
}));
const logged_out_all_device = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    if (!email) {
        throw new app_error_1.AppError(404, "Email not found from token");
    }
    yield auth_service_1.auth_service.logged_out_all_device_from_db(email);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "All device logged out",
    });
}));
const login_user_with_google = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.auth_service.login_user_with_google_from_db(req, req === null || req === void 0 ? void 0 : req.body);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Login Successful.",
        data: result,
    });
}));
const delete_account = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    yield auth_service_1.auth_service.delete_account_from_db(userId);
    (0, send_response_1.sendResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Account deleted successfully",
    });
}));
exports.auth_controller = {
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
