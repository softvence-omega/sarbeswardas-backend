import { AppError } from "../../utils/app_error";
import catchAsync from "../../utils/catch_async";
import { uploadToCloudinary } from "../../utils/cloudinaryUploader";
import { sendResponse } from "../../utils/send_response";
import { profile_service } from "./profile.service";

const get_profile_info = catchAsync(async (req, res) => {
  const email = req.user?.email;

  const result = await profile_service.get_profile_info_from_db(email!);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User retrieved successfully",
    data: result,
  });
});

const update_profile_name = catchAsync(async (req, res) => {
  const email = req.user?.email;
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

  const result = await profile_service.update_profile_name_into_db(email, fullName);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User name updated successfully",
    data: result,
  });
});

export const update_profile_image = catchAsync(async (req, res) => {
  const email = req.user?.email;
  const file = req.file;

  if (!email) throw new AppError(401, "Unauthorized: email not found");
  if (!file) throw new AppError(400, "No image file uploaded");

  const uploaded = await uploadToCloudinary(file); 
  await profile_service.update_profile_image_into_db(email, uploaded.url);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Profile image updated successfully",
    data: { imageUrl: uploaded.url },
  });
});


export const profile_controller = {
  get_profile_info,
  update_profile_name,
  update_profile_image,
};
