import { type Request, type Response, type NextFunction } from "express";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): any => {
  console.error("🔥 Global Error Caught:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    // Optionally include error details only in development mode
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
};
