import { type Response } from "express";

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string | undefined,
  data?: any,
) => {
  res.status(statusCode).json({
    success: true,
    message: message || undefined,
    data: data !== undefined ? data : undefined,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: any,
) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
