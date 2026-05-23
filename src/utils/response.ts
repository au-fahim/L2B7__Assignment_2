import { type Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message?: string,
  data?: T,
) => {
  res.status(statusCode).json({
    success: true,
    message : message || undefined,
    data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
