import { type Response } from "express";
import pool from "../../config/db";
import type { AuthRequest } from "../../middleware/auth.middleware";

export const createIssue = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const { title, description, type } = req.body;

    // Extract the reporter_id securely from the verified JWT
    const reporterId = req.user.id;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and type are required",
      });
    }

    if (!["bug", "feature_request"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue type. Must be bug or feature_request",
      });
    }

    const insertQuery = `
      INSERT INTO issues (title, description, type, reporter_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, type, status, reporter_id, created_at, updated_at;
    `;

    const result = await pool.query(insertQuery, [
      title,
      description,
      type,
      reporterId,
    ]);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
