import { type Request, type Response } from "express";
import pool from "../../config/db";
import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../../utils/authUtils";

// ########## Signup Controller ##########

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Name, email, and password are required",
        });
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

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === "23505") {
      // PostgreSQL unique violation error code
      return res
        .status(409)
        .json({ success: false, error: "Email already exists" });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ########## Login Controller ##########

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }

    const userQuery = `SELECT * FROM users WHERE email = $1;`;
    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "User not found :(" });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Wrong password :<" });
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, user: { ...user, password: undefined } },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
