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
const app_error_1 = require("../utils/app_error");
const JWT_1 = require("../utils/JWT");
const config_1 = __importDefault(require("../config"));
// import { TRole } from "../modules/auth/auth.interface";
const auth_schema_1 = require("../modules/auth/auth.schema");
// ...role: TRole[]
const auth = () => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            let token;
            // ✅ Prefer Bearer token from headers, fallback to cookies
            if (req.headers.authorization) {
                token = req.headers.authorization;
            }
            else if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) {
                token = req.cookies.accessToken;
            }
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Token missing.",
                });
            }
            const verifyUser = JWT_1.jwtHelpers.verifyToken(token, config_1.default.access_token_secret);
            // if (!role.length || !role.includes(verifyUser.role)) {
            //   throw new AppError(401, "You are not authorized!!");
            // }
            const isUserExist = yield auth_schema_1.User_Model.findOne({ email: verifyUser.email });
            if (!isUserExist) {
                throw new app_error_1.AppError(404, "This user not exist!!");
            }
            if (isUserExist.isDeleted === true) {
                throw new app_error_1.AppError(401, "Account is deleted.");
            }
            // if (isUserExist.isActive === "SUSPENDED") {
            //   throw new AppError(401, "Suspended user.");
            // }
            if (isUserExist.isActive === "INACTIVE") {
                throw new app_error_1.AppError(401, "Inactive user");
            }
            if (isUserExist.isVerified === false) {
                throw new app_error_1.AppError(401, "Account not verified");
            }
            const validDevice = (_b = isUserExist.loggedInDevices) === null || _b === void 0 ? void 0 : _b.some((d) => d.deviceId === verifyUser.deviceId);
            if (!validDevice)
                throw new app_error_1.AppError(401, "Session expired or device logged out");
            req.user = verifyUser;
            next();
        }
        catch (error) {
            next(error);
        }
    });
};
exports.default = auth;
