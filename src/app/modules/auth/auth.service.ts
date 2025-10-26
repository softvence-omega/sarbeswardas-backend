import { v4 as uuidv4 } from "uuid";
import config from "../../config";
import { AppError } from "../../utils/app_error";
import { jwtHelpers } from "../../utils/JWT";
import { TUser } from "./auth.interface";
import { User_Model } from "./auth.schema";
import bcrypt from "bcrypt";
import { OTPMaker } from "../../utils/otp_maker";
import { Request } from "express";
import { UAParser } from "ua-parser-js";
import mongoose from "mongoose";
import { sendEmail } from "../../utils/send_email";

interface GooglePayload {
  email: string;
  provider: string;
  fullName: string;
  photoUrl?: string;
}

const sign_up_user_into_db = async (payload: TUser) => {
  const { email, password } = payload;
  if (!email || !password) {
    throw new AppError(400, "Email or password missing");
  }

  const isUserExist = await User_Model.findOne({ email });
  if (isUserExist) {
    throw new AppError(409, "Account already exist! Try with new email.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const modifiedData = { ...payload, password: hashedPassword };

  const updatedUser = await User_Model.create(modifiedData);
  if (!updatedUser) {
    throw new AppError(403, "Failed to create user");
  }

  const otp = OTPMaker();
  await User_Model.findOneAndUpdate({ email }, { lastOTP: otp });

  const otpDigits = otp.split("");

  const emailTemp = `
    <table ...>
      ...
      <tr>
        ${otpDigits
          .map(
            (digit) => `
            <td align="center" valign="middle"
              style="background:#f5f3ff; border-radius:12px; width:56px; height:56px;">
              <div style="font-size:22px; line-height:56px; color:#111827; font-weight:700; text-align:center;">
                ${digit}
              </div>
            </td>
            <td style="width:12px;">&nbsp;</td>
          `
          )
          .join("")}
      </tr>
      ...
    </table>
  `;

  // await sendEmail(email, "Your OTP", emailTemp);
  // return "Check your email for OTP";
  return "User register successfully"
};

const verify_email_into_db = async (payload: { email: string; otp: string }) => {
  const { email, otp } = payload;

  const user = await User_Model.findOne({ email });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.lastOTP !== otp) {
    throw new AppError(403, "Wrong OTP");
  }

  const result = await User_Model.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
  if (!result) {
    throw new AppError(500, "Failed to update verify status");
  }

  return "";
};

const login_user_into_db = async (req: Request, payload: { email: string; password: string }) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError(400, "Email or password missing");
  }

  const user = await User_Model.findOne({ email, isDeleted: false });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.isVerified === false) {
    throw new AppError(403, "Email not verified");
  }

  const isPasswordMatch = await bcrypt.compare(password, user?.password as string);

  if (!isPasswordMatch) {
    throw new AppError(403, "Wrong password!!");
  }

  const deviceId = uuidv4();
  const userAgent = req.headers["user-agent"] || "Unknown";
  let ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (Array.isArray(ip)) {
    ip = ip[0];
  }
  if (typeof ip !== "string") {
    ip = ip ? String(ip) : "Unknown";
  }

  // Parse device info
  const parser = new UAParser(userAgent);
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
  await user.save();

  // Generate JWT including deviceId
  const accessToken = jwtHelpers.generateToken(
    { email: user.email, deviceId, userId: user._id },
    config.access_token_secret as string,
    config.access_token_expires_in as string
  );

  return { accessToken };
};

const change_password_into_db = async (payload: {
  email: string;
  oldPassword: string;
  newPassword: string;
}) => {
  const { email, oldPassword, newPassword } = payload;

  if (!email || !oldPassword || !newPassword) {
    throw new AppError(400, "Email or oldPassword or newPassword missing");
  }

  const user = await User_Model.findOne({ email, isDeleted: false, isVerified: true });
  if (!user) {
    throw new AppError(404, "User not found!!");
  }

  const isPasswordMatch = await bcrypt.compare(oldPassword, user.password!);
  if (!isPasswordMatch) {
    throw new AppError(409, "Wrong password!!");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;

  const updatedUser = await user.save();
  if (!updatedUser) {
    throw new AppError(500, "Failed to change password. Please try again later.");
  }

  return updatedUser;
};

const forgot_password = async (emailInput: string | { email: string }) => {
  const email = typeof emailInput === "string" ? emailInput : emailInput.email;

  const user = await User_Model.findOne({ email, isDeleted: false });
  if (!user) throw new AppError(404, "User not found");

  const otp = OTPMaker();
  await User_Model.findOneAndUpdate({ email }, { lastOTP: otp });

  const otpDigits = otp.split("");

  const emailTemp = `
    <table ...>
      ...
      <tr>
        ${otpDigits
          .map(
            (digit) => `
            <td align="center" valign="middle"
              style="background:#f5f3ff; border-radius:12px; width:56px; height:56px;">
              <div style="font-size:22px; line-height:56px; color:#111827; font-weight:700; text-align:center;">
                ${digit}
              </div>
            </td>
            <td style="width:12px;">&nbsp;</td>
          `
          )
          .join("")}
      </tr>
      ...
    </table>
  `;

  await sendEmail(email, "Your OTP", emailTemp);
  return "Check your email for OTP";

  // const result = await sendEmailWithBrevo(email, "Your forgot password OTP", emailTemp);
  // console.log(result);

  // const resendResponse = await sendEmailWithResend(email, "Your forgot password OTP", emailTemp);
  // console.log(resendResponse);
  // return resendResponse;
};

const reset_password_into_db = async (email: string, otp: string, newPassword: string) => {
  const user = await User_Model.findOne({ email });
  if (!user) throw new AppError(404, "User not found");

  const verifyOTP = user.lastOTP === otp;
  if (!verifyOTP) {
    throw new AppError(409, "Invalid OTP");
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = newHashedPassword;

  const updatedUser = await user.save();
  if (!updatedUser) {
    throw new AppError(500, "Failed to change password. Please try again later.");
  }

  return "";
};

const logged_out_all_device_from_db = async (email: string) => {
  const user = await User_Model.findOne({ email, isDeleted: false });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  user.loggedInDevices = [];
  const updatedUser = await user.save();
  if (!updatedUser) {
    throw new AppError(500, "Failed to logged out from all device");
  }

  return "";
};

const login_user_with_google_from_db = async (payload: GooglePayload) => {
  if (!payload) {
    throw new AppError(400, "Missing Google data");
  }
  //  Validate input early
  if (!payload.email || !payload.provider || !payload.fullName) {
    throw new AppError(400, "Missing required Google login data");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    //  Find existing user
    let user = await User_Model.findOne({ email: payload.email }).session(session);

    //  If user doesn’t exist, create one
    if (!user) {
      const newUsers = await User_Model.create(
        [
          {
            email: payload.email,
            provider: payload.provider,
            firstName: payload.fullName,
            isVerified: true,
            profileImage: payload.photoUrl || undefined,
          },
        ],
        { session }
      );

      user = newUsers[0];
    }

    //  Commit transaction before using user
    await session.commitTransaction();
    session.endSession();

    //  Post-checks after commit
    if (!user) throw new AppError(404, "Account not found");
    if (user.isDeleted) throw new AppError(403, "This account has been deleted");
    if (user.isActive === "INACTIVE") throw new AppError(403, "This account is blocked");

    //  Generate JWT
    const accessToken = jwtHelpers.generateToken(
      { email: user.email, userId: user._id },
      config.access_token_secret as string,
      config.access_token_expires_in as string
    );

    return {
      success: true,
      message: user ? "Login successful" : "Account created successfully",
      accessToken,
    };
  } catch (error) {
    // Rollback if any failure
    await session.abortTransaction();
    session.endSession();
    throw new AppError(500, (error as Error).message || "Google login failed");
  }
};

const delete_account_from_db = async (userId: string) => {
  const user = User_Model.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await User_Model.findByIdAndUpdate(
    userId,
    { isDeleted: true },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError(500, "Failed to delete account");
  }

  return updatedUser;
};

export const auth_service = {
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
