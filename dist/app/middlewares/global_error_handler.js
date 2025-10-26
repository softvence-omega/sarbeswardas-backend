"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const zod_1 = require("zod");
const app_error_1 = require("../utils/app_error");
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors = null;
    if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = "Validation Error";
        errors = err.issues.map((issue) => {
            let friendlyMessage = issue.message;
            if (issue.message.includes("expected string")) {
                friendlyMessage = `${issue.path.join(".")} field is required`;
            }
            return {
                path: issue.path.join("."),
                message: friendlyMessage,
            };
        });
    }
    else if (err instanceof app_error_1.AppError) {
        statusCode = err.statusCode || 400;
        message = err.message;
    }
    console.error("🔥 Error:", err);
    res.status(statusCode).json(Object.assign({ success: false, message }, (errors && { errors })));
};
exports.globalErrorHandler = globalErrorHandler;
