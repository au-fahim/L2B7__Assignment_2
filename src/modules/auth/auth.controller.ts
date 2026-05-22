import { type Request, type Response } from "express";
import pool from "../../config/db";
import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../../utils/authUtils";
import { sendError, sendSuccess } from "../../utils/response";

// ########## Signup Controller ##########

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, "Name, email, and password are required");
    }

    const hashedPassword: string = await hashPassword(password);
    const userRole: string =
      role === "maintainer" ? "maintainer" : "contributor";

    const insertQuery = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at;
    `;

    const result = await pool.query(insertQuery, [
      name,
      email,
      hashedPassword,
      userRole,
    ]);

    sendSuccess(res, 201, "User registered successfully", result.rows[0]);
  } catch (error: any) {
    if (error.code === "23505") {
      // PostgreSQL unique violation error code
      return sendError(res, 409, "Email already exists");
    }

    sendError(res, 500, "Internal server error");
  }
};

// ########## Login Controller ##########

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    const userQuery = `SELECT * FROM users WHERE email = $1;`;
    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return sendError(res, 401, "User not found :(");
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return sendError(res, 401, "Wrong password :<");
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      role: user.role,
    });

    sendSuccess(res, 200, "Login successful", {
      token,
      user: { ...user, password: undefined },
    });
  } catch (error: any) {
    sendError(res, 500, "Internal server error");
  }
};
