import { Secret } from "jsonwebtoken";
import config from "../../config";
import { AppError } from "../../utils/app_error";
import { jwtHelpers } from "../../utils/JWT";
import { TUser } from "./auth.interface";
import { User_Model } from "./auth.schema";
import bcrypt from "bcrypt";
import { sendEmail } from "../../utils/send_email";
import jwt from "jsonwebtoken";
import { OTPMaker } from "../../utils/otp_maker";

const sign_up_user_into_db = async (payload: TUser) => {
  const { email } = payload;

  const isUserExist = await User_Model.findOne({ email });
  if (isUserExist) {
    throw new AppError(409, "Account already exist! Try with new email.");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const modifiedData = { ...payload, password: hashedPassword };

  await User_Model.create(modifiedData);

  return "";
};

const login_user_into_db = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const user = await User_Model.findOne({ email, isDeleted: false });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const isPasswordMatch = await bcrypt.compare(password, user?.password as string);

  if (!isPasswordMatch) {
    throw new AppError(403, "Invalid password!!");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      email: user?.email,
      role: user?.role,
      accountId: user?._id,
    },
    config.access_token_secret as Secret,
    config.access_token_expires_in as string
  );

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

  return { accessToken };
};

const change_password_into_db = async (payload: {
  email: string;
  oldPassword: string;
  newPassword: string;
}) => {
  const { email, oldPassword, newPassword } = payload;

  const user = await User_Model.findOne({ email, isDeleted: false, isVerified: true });
  if (!user) {
    throw new AppError(404, "User not found!!");
  }

  const isPasswordMatch = bcrypt.compare(oldPassword, user.password);
  if (!isPasswordMatch) {
    throw new AppError(409, "Invalid password!!");
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

  return "Check your email for reset link";
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

export const auth_service = {
  sign_up_user_into_db,
  login_user_into_db,
  change_password_into_db,
  forgot_password,
  reset_password_into_db,
};
