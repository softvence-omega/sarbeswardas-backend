"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.auth_service = void 0;
const config_1 = __importDefault(require("../../config"));
const app_error_1 = require("../../utils/app_error");
const JWT_1 = require("../../utils/JWT");
const auth_schema_1 = require("./auth.schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const otp_maker_1 = require("../../utils/otp_maker");
const ua_parser_js_1 = require("ua-parser-js");
const mongoose_1 = __importDefault(require("mongoose"));
const send_email_1 = require("../../utils/send_email");
// Helper to generate UUID dynamically (ESM-safe)
const generateUUID = () => __awaiter(void 0, void 0, void 0, function* () {
    const { v4: uuidv4 } = yield Promise.resolve().then(() => __importStar(require("uuid")));
    return uuidv4();
});
const sign_up_user_into_db = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload;
    if (!email || !password) {
        throw new app_error_1.AppError(400, "Email or password missing");
    }
    const isUserExist = yield auth_schema_1.User_Model.findOne({ email });
    if (isUserExist) {
        throw new app_error_1.AppError(409, "Account already exist! Try with new email.");
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const modifiedData = Object.assign(Object.assign({}, payload), { password: hashedPassword });
    const updatedUser = yield auth_schema_1.User_Model.create(modifiedData);
    if (!updatedUser) {
        throw new app_error_1.AppError(403, "Failed to create user");
    }
    const otp = (0, otp_maker_1.OTPMaker)();
    yield auth_schema_1.User_Model.findOneAndUpdate({ email }, { lastOTP: otp });
    const otpDigits = otp.split("");
    const emailTemp = `
    <table ...>
      ...
      <tr>
        ${otpDigits
        .map((digit) => `
            <td align="center" valign="middle"
              style="background:#f5f3ff; border-radius:12px; width:56px; height:56px;">
              <div style="font-size:22px; line-height:56px; color:#111827; font-weight:700; text-align:center;">
                ${digit}
              </div>
            </td>
            <td style="width:12px;">&nbsp;</td>
          `)
        .join("")}
      </tr>
      ...
    </table>
  `;
    // await sendEmail(email, "Your OTP", emailTemp);
    return "User register successfully";
});
const verify_email_into_db = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = payload;
    const user = yield auth_schema_1.User_Model.findOne({ email });
    if (!user) {
        throw new app_error_1.AppError(404, "User not found");
    }
    if (user.lastOTP !== otp) {
        throw new app_error_1.AppError(403, "Wrong OTP");
    }
    const result = yield auth_schema_1.User_Model.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
    if (!result) {
        throw new app_error_1.AppError(500, "Failed to update verify status");
    }
    return "";
});
const login_user_into_db = (req, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload;
    if (!email || !password) {
        throw new app_error_1.AppError(400, "Email or password missing");
    }
    const user = yield auth_schema_1.User_Model.findOne({ email, isDeleted: false });
    if (!user) {
        throw new app_error_1.AppError(404, "User not found");
    }
    if (user.isVerified === false) {
        throw new app_error_1.AppError(403, "Email not verified");
    }
    const isPasswordMatch = yield bcrypt_1.default.compare(password, user === null || user === void 0 ? void 0 : user.password);
    if (!isPasswordMatch) {
        throw new app_error_1.AppError(403, "Wrong password!!");
    }
    const deviceId = yield generateUUID();
    const userAgent = req.headers["user-agent"] || "Unknown";
    let ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (Array.isArray(ip))
        ip = ip[0];
    if (typeof ip !== "string")
        ip = ip ? String(ip) : "Unknown";
    const parser = new ua_parser_js_1.UAParser(userAgent);
    const device = {
        deviceId,
        userAgent: `${parser.getBrowser().name} on ${parser.getOS().name}`,
        ip,
        loggedInAt: new Date(),
    };
    let updatedDevices = user.loggedInDevices || [];
    updatedDevices.push(device);
    if (updatedDevices.length > 3) {
        updatedDevices = updatedDevices.slice(updatedDevices.length - 3);
    }
    user.loggedInDevices = updatedDevices;
    yield user.save();
    const accessToken = JWT_1.jwtHelpers.generateToken({ email: user.email, deviceId, userId: user._id }, config_1.default.access_token_secret, config_1.default.access_token_expires_in);
    return { accessToken };
});
const change_password_into_db = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, oldPassword, newPassword } = payload;
    if (!email || !oldPassword || !newPassword) {
        throw new app_error_1.AppError(400, "Email or oldPassword or newPassword missing");
    }
    const user = yield auth_schema_1.User_Model.findOne({ email, isDeleted: false, isVerified: true });
    if (!user) {
        throw new app_error_1.AppError(404, "User not found!!");
    }
    const isPasswordMatch = yield bcrypt_1.default.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
        throw new app_error_1.AppError(409, "Wrong password!!");
    }
    const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 10);
    user.password = hashedNewPassword;
    const updatedUser = yield user.save();
    if (!updatedUser) {
        throw new app_error_1.AppError(500, "Failed to change password. Please try again later.");
    }
    return updatedUser;
});
// === Forgot / Reset Password ===
const forgot_password = (emailInput) => __awaiter(void 0, void 0, void 0, function* () {
    const email = typeof emailInput === "string" ? emailInput : emailInput.email;
    const user = yield auth_schema_1.User_Model.findOne({ email, isDeleted: false });
    if (!user)
        throw new app_error_1.AppError(404, "User not found");
    const otp = (0, otp_maker_1.OTPMaker)();
    yield auth_schema_1.User_Model.findOneAndUpdate({ email }, { lastOTP: otp });
    const otpDigits = otp.split("");
    const emailTemp = `
    <table ...>
      ...
      <tr>
        ${otpDigits
        .map((digit) => `
            <td align="center" valign="middle"
              style="background:#f5f3ff; border-radius:12px; width:56px; height:56px;">
              <div style="font-size:22px; line-height:56px; color:#111827; font-weight:700; text-align:center;">
                ${digit}
              </div>
            </td>
            <td style="width:12px;">&nbsp;</td>
          `)
        .join("")}
      </tr>
      ...
    </table>
  `;
    yield (0, send_email_1.sendEmail)(email, "Your OTP", emailTemp);
    return "Check your email for OTP";
});
const reset_password_into_db = (email, otp, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_schema_1.User_Model.findOne({ email });
    if (!user)
        throw new app_error_1.AppError(404, "User not found");
    if (user.lastOTP !== otp) {
        throw new app_error_1.AppError(409, "Invalid OTP");
    }
    const newHashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
    user.password = newHashedPassword;
    const updatedUser = yield user.save();
    if (!updatedUser) {
        throw new app_error_1.AppError(500, "Failed to change password. Please try again later.");
    }
    return "";
});
// === Logout / Google Login / Delete ===
const logged_out_all_device_from_db = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_schema_1.User_Model.findOne({ email, isDeleted: false });
    if (!user)
        throw new app_error_1.AppError(404, "User not found");
    user.loggedInDevices = [];
    const updatedUser = yield user.save();
    if (!updatedUser) {
        throw new app_error_1.AppError(500, "Failed to log out from all devices");
    }
    return "";
});
const login_user_with_google_from_db = (req, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload || !payload.email || !payload.provider || !payload.fullName) {
        throw new app_error_1.AppError(400, "Missing required Google login data");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        let user = yield auth_schema_1.User_Model.findOne({ email: payload.email }).session(session);
        if (!user) {
            const newUsers = yield auth_schema_1.User_Model.create([
                {
                    email: payload.email,
                    provider: payload.provider,
                    fullName: payload.fullName,
                    isVerified: true,
                    profileImage: payload.photoUrl || "",
                },
            ], { session });
            user = newUsers[0];
        }
        yield session.commitTransaction();
        session.endSession();
        if (!user)
            throw new app_error_1.AppError(404, "Account not found");
        if (user.isDeleted)
            throw new app_error_1.AppError(403, "This account has been deleted");
        if (user.isActive === "INACTIVE")
            throw new app_error_1.AppError(403, "This account is blocked");
        const deviceId = yield generateUUID();
        const userAgent = req.headers["user-agent"] || "Unknown";
        let ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        if (Array.isArray(ip))
            ip = ip[0];
        if (typeof ip !== "string")
            ip = ip ? String(ip) : "Unknown";
        const parser = new ua_parser_js_1.UAParser(userAgent);
        const device = {
            deviceId,
            userAgent: `${parser.getBrowser().name} on ${parser.getOS().name}`,
            ip,
            loggedInAt: new Date(),
        };
        let updatedDevices = user.loggedInDevices || [];
        updatedDevices.push(device);
        if (updatedDevices.length > 3) {
            updatedDevices = updatedDevices.slice(updatedDevices.length - 3);
        }
        user.loggedInDevices = updatedDevices;
        yield user.save();
        const accessToken = JWT_1.jwtHelpers.generateToken({ email: user.email, deviceId, userId: user._id }, config_1.default.access_token_secret, config_1.default.access_token_expires_in);
        return { accessToken };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new app_error_1.AppError(500, error.message || "Google login failed");
    }
});
const delete_account_from_db = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_schema_1.User_Model.findById(userId);
    if (!user)
        throw new app_error_1.AppError(404, "User not found");
    const updatedUser = yield auth_schema_1.User_Model.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
    if (!updatedUser)
        throw new app_error_1.AppError(500, "Failed to delete account");
    return updatedUser;
});
exports.auth_service = {
    sign_up_user_into_db,
    verify_email_into_db,
    login_user_into_db,
    change_password_into_db,
    forgot_password,
    reset_password_into_db,
    logged_out_all_device_from_db,
    login_user_with_google_from_db,
    delete_account_from_db,
};
