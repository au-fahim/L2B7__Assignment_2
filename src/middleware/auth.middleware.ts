import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export interface AuthRequest extends Request {
  user?: any;
}

// Middleware to check if the user is authenticated
export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): any => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Malformed token.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach the decoded payload (id, name, role) to the request
    next(); // Pass control to the next function (the controller)
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Middleware to check if the user is a maintainer
export const isMaintainer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): any => {
  // Check if the user object exists AND if the role is exactly "maintainer"
  if (!req.user || req.user.role !== "maintainer") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to perform this action",
    });
  }

  next();
};
