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
exports.auth_service = exports.login_user_with_google_from_db = void 0;
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../../config"));
const app_error_1 = require("../../utils/app_error");
const JWT_1 = require("../../utils/JWT");
const auth_schema_1 = require("./auth.schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const otp_maker_1 = require("../../utils/otp_maker");
const ua_parser_js_1 = require("ua-parser-js");
const sendEmailWithBrevo_1 = require("../../utils/sendEmailWithBrevo");
const mongoose_1 = __importDefault(require("mongoose"));
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
    const isPasswordMatch = yield bcrypt_1.default.compare(password, user === null || user === void 0 ? void 0 : user.password);
    if (!isPasswordMatch) {
        throw new app_error_1.AppError(403, "Wrong password!!");
    }
    const deviceId = (0, uuid_1.v4)();
    const userAgent = req.headers["user-agent"] || "Unknown";
    let ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (Array.isArray(ip)) {
        ip = ip[0];
    }
    if (typeof ip !== "string") {
        ip = ip ? String(ip) : "Unknown";
    }
    // Parse device info
    const parser = new ua_parser_js_1.UAParser(userAgent);
    const device = {
        deviceId,
        userAgent: `${parser.getBrowser().name} on ${parser.getOS().name}`,
        ip,
        loggedInAt: new Date(),
    };
    console.log({ device });
    // Keep only last 2–3 devices
    let updatedDevices = user.loggedInDevices || [];
    updatedDevices.push(device);
    if (updatedDevices.length > 3) {
        // remove the oldest login
        updatedDevices = updatedDevices.slice(updatedDevices.length - 3);
    }
    user.loggedInDevices = updatedDevices;
    yield user.save();
    // Generate JWT including deviceId
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
    // await sendEmail(email, "Your OTP", emailTemp);
    // return "Check your email for OTP";
    const result = yield (0, sendEmailWithBrevo_1.sendEmailWithBrevo)(email, "Your forgot password OTP", emailTemp);
    console.log(result);
    // const resendResponse = await sendEmailWithResend(email, "Your forgot password OTP", emailTemp);
    // console.log(resendResponse);
    // return resendResponse;
});
const reset_password_into_db = (email, otp, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_schema_1.User_Model.findOne({ email });
    if (!user)
        throw new app_error_1.AppError(404, "User not found");
    const verifyOTP = user.lastOTP === otp;
    if (!verifyOTP) {
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
const logged_out_all_device_from_db = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_schema_1.User_Model.findOne({ email, isDeleted: false });
    if (!user) {
        throw new app_error_1.AppError(404, "User not found");
    }
    user.loggedInDevices = [];
    const updatedUser = yield user.save();
    if (!updatedUser) {
        throw new app_error_1.AppError(500, "Failed to logged out from all device");
    }
    return "";
});
const login_user_with_google_from_db = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload) {
        throw new app_error_1.AppError(400, "Missing Google data");
    }
    //  Validate input early
    if (!payload.email || !payload.provider || !payload.fullName) {
        throw new app_error_1.AppError(400, "Missing required Google login data");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        //  Find existing user
        let user = yield auth_schema_1.User_Model.findOne({ email: payload.email }).session(session);
        //  If user doesn’t exist, create one
        if (!user) {
            const newUsers = yield auth_schema_1.User_Model.create([
                {
                    email: payload.email,
                    provider: payload.provider,
                    firstName: payload.fullName,
                    isVerified: true,
                    profileImage: payload.photoUrl || undefined,
                },
            ], { session });
            user = newUsers[0];
        }
        //  Commit transaction before using user
        yield session.commitTransaction();
        session.endSession();
        //  Post-checks after commit
        if (!user)
            throw new app_error_1.AppError(404, "Account not found");
        if (user.isDeleted)
            throw new app_error_1.AppError(403, "This account has been deleted");
        if (user.isActive === "INACTIVE")
            throw new app_error_1.AppError(403, "This account is blocked");
        //  Generate JWT
        const accessToken = JWT_1.jwtHelpers.generateToken({ email: user.email, userId: user._id }, config_1.default.access_token_secret, config_1.default.access_token_expires_in);
        return {
            success: true,
            message: user ? "Login successful" : "Account created successfully",
            accessToken,
        };
    }
    catch (error) {
        // Rollback if any failure
        yield session.abortTransaction();
        session.endSession();
        throw new app_error_1.AppError(500, error.message || "Google login failed");
    }
});
exports.login_user_with_google_from_db = login_user_with_google_from_db;
exports.auth_service = {
    sign_up_user_into_db,
    login_user_into_db,
    change_password_into_db,
    forgot_password,
    reset_password_into_db,
    logged_out_all_device_from_db,
    login_user_with_google_from_db: exports.login_user_with_google_from_db,
};
// Generate token valid for 1 hour
// const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
//   expiresIn: "1h",
// });
// // Create verification link
// const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
// // Email content
// const html = `
//   <div>
//     <h3>Welcome to Our App</h3>
//     <p>Click below to verify your email:</p>
//     <a href="${verifyUrl}"
//        style="background: #007bff; color: white; padding: 10px 20px;
//        text-decoration: none; border-radius: 4px;">
//        Verify Email
//     </a>
//   </div>
// `;
// // Send email
// await sendEmail(email, "Verify your email", html);
