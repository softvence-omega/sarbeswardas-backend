import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app_error";
import { jwtHelpers, JwtPayloadType } from "../utils/JWT";
import config from "../config";
// import { TRole } from "../modules/auth/auth.interface";
import { User_Model } from "../modules/auth/auth.schema";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadType;
    }
  }
}
// ...role: TRole[]
const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      // ✅ Prefer Bearer token from headers, fallback to cookies
      if (req.headers.authorization) {
        token = req.headers.authorization;
      } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Token missing.",
        });
      }

      const verifyUser = jwtHelpers.verifyToken(token, config.access_token_secret as string);
      // if (!role.length || !role.includes(verifyUser.role)) {
      //   throw new AppError(401, "You are not authorized!!");
      // }

      const isUserExist = await User_Model.findOne({ email: verifyUser.email });
      if (!isUserExist) {
        throw new AppError(404, "This user not exist!!");
      }

      if (isUserExist.isDeleted === true) {
        throw new AppError(401, "Account is deleted.");
      }

      // if (isUserExist.isActive === "SUSPENDED") {
      //   throw new AppError(401, "Suspended user.");
      // }

      if (isUserExist.isActive === "INACTIVE") {
        throw new AppError(401, "Inactive user");
      }

      if (isUserExist.isVerified === false) {
        throw new AppError(401, "Account not verified");
      }

      const validDevice = isUserExist.loggedInDevices?.some(
        (d) => d.deviceId === verifyUser.deviceId
      );

      if (!validDevice) throw new AppError(401, "Session expired or device logged out");

      req.user = verifyUser as JwtPayloadType;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
