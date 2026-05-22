import { type Request, type Response, type NextFunction } from "express";
import { sendError } from "../utils/response";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): any => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  sendError(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === "development" ? err.stack : null,
  );
};
