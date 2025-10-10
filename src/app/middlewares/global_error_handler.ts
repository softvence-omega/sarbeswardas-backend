import { ZodError } from "zod";
import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app_error";

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: any = null;

  if (err instanceof ZodError) {
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
  } else if (err instanceof AppError) {
    statusCode = err.statusCode || 400;
    message = err.message;
  }

  console.error("🔥 Error:", err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};
