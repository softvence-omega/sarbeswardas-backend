"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.change_password_schema = exports.login_schema = exports.register_schema = void 0;
const zod_1 = require("zod");
exports.register_schema = zod_1.z.object({});
exports.login_schema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string("Password is required"),
});
exports.change_password_schema = zod_1.z.object({
    oldPassword: zod_1.z.string("oldPassword is required"),
    newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters"),
});
