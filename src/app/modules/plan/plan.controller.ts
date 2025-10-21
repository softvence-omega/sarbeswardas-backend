import { AppError } from "../../utils/app_error";
import catchAsync from "../../utils/catch_async";
import { sendResponse } from "../../utils/send_response";
import { plan_service } from "./plan.service";

const get_all_plan = catchAsync(async (req, res) => {
  const result = await plan_service.get_all_plan_from_db();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Plan retrieved successfully",
    data: result,
  });
});

const create_plan = catchAsync(async (req, res) => {
  const payload = req.body;
  if (!payload) {
    throw new AppError(404, "Payload not found");
  }

  const result = await plan_service.create_plan_into_db(payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Plan retrieved successfully",
    data: result,
  });
});

export const plan_controller = {
  get_all_plan,
  create_plan,
};
