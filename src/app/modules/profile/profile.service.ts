import { AppError } from "../../utils/app_error";
import { User_Model } from "../auth/auth.schema";

const get_profile_info_from_db = async (email: string) => {
  const user = await User_Model.findOne({ email, isDeleted: false }).select(
    "_id fullName email profileImage isVerified subscriptionStatus trialEndsAt hasUsedTrial createdAt updatedAt"
  );
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

const update_profile_name_into_db = async (email: string, fullName: string) => {
  const updatedUser = await User_Model.findOneAndUpdate(
    { email },
    { fullName },
    { new: true, projection: "fullName" }
  );

  if (!updatedUser) {
    throw new AppError(404, "User not found or update failed");
  }

  return updatedUser;
};

const update_profile_image_into_db = async (email: string, imageUrl: string) => {
  const updatedUser = await User_Model.findOneAndUpdate(
    { email },
    { profileImage: imageUrl },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError(404, "User not found or failed to update profile image");
  }

  return updatedUser;
};

export const profile_service = {
  get_profile_info_from_db,
  update_profile_name_into_db,
  update_profile_image_into_db,
};
