import { Response } from "express";

interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export const sendResponse = <T>(res: Response, data: IApiResponse<T>): void => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message || "",
    meta: data.meta || null,
    data: data.data || null,
  });
};
