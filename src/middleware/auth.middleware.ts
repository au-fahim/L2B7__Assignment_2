import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response";
import type { TokenPayload } from "../types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Middleware to check if the user is authenticated
export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Access denied. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, 401, "Access denied. Malformed token.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded as TokenPayload; // Attach the decoded payload (id, name, role) to the request
    next(); // Pass control to the next function (the controller)
  } catch (error) {
    return sendError(res, 401, "Invalid or expired token.");
  }
};

// Middleware to check if the user is a maintainer
export const isMaintainer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // Check if the user object exists AND if the role is exactly "maintainer"
  if (!req.user || req.user.role !== "maintainer") {
    return sendError(
      res,
      403,
      "Forbidden: You do not have permission to delete an issue.",
    );
  }

  next();
};
