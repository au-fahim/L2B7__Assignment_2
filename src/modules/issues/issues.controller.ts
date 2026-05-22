import { type Request, type Response } from "express";
import pool from "../../config/db";
import type { AuthRequest } from "../../middleware/auth.middleware";

// ##### Create Issue - Controller #####
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

// ##### Get All Issues (with sorting and filtering) - Controller #####
export const getAllIssues = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const { type, status, sort } = req.query;

    let query = `SELECT * FROM issues`;
    const queryParams: any[] = [];
    const whereClauses: string[] = [];

    // 1. Filtering by type
    if (type === "bug" || type === "feature_request") {
      queryParams.push(type);
      whereClauses.push(`type = $${queryParams.length}`);
    }

    // 2. Filtering by status
    if (
      status === "open" ||
      status === "in_progress" ||
      status === "resolved"
    ) {
      queryParams.push(status);
      whereClauses.push(`status = $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(" AND ");
    }

    // 3. Sorting ('newest' is default, 'oldest' ascending)
    if (sort === "oldest") {
      query += ` ORDER BY created_at ASC;`;
    } else {
      query += ` ORDER BY created_at DESC;`;
    }

    const issueResult = await pool.query(query, queryParams);
    const issues = issueResult.rows;

    if (issues.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

    // Fetch only the users that reported these specific issues
    const userQuery = `SELECT id, name, role FROM users WHERE id = ANY($1::int[]);`;
    const userResult = await pool.query(userQuery, [reporterIds]);

    const userMap: Record<number, any> = {};
    userResult.rows.forEach((user) => {
      userMap[user.id] = user;
    });

    const formattedData = issues.map((issue) => {
      const { reporter_id } = issue;

      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: userMap[reporter_id],
        created_at: issue.created_at.toISOString(),
        updated_at: issue.updated_at.toISOString(),
      };
    });

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching issues:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ##### Get Issue by ID - Controller #####
export const getIssueById = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const issueId = req.params.id;

    // 1. Fetch the specific issue
    const issueQuery = `SELECT * FROM issues WHERE id = $1;`;
    const issueResult = await pool.query(issueQuery, [issueId]);

    if (issueResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const issue = issueResult.rows[0];

    // 2. Fetch the specific reporter
    const userQuery = `SELECT id, name, role FROM users WHERE id = $1;`;
    const userResult = await pool.query(userQuery, [issue.reporter_id]);

    res.status(200).json({
      success: true,
      data: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: userResult.rows[0] || null,
        created_at: issue.created_at.toISOString(),
        updated_at: issue.updated_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching single issue:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ##### Update Issue - Controller #####
export const updateIssue = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const issueId = req.params.id;
    const { title, description, type, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const checkQuery = `SELECT reporter_id, status FROM issues WHERE id = $1;`;
    const checkResult = await pool.query(checkQuery, [issueId]);

    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const existingIssue = checkResult.rows[0];

    if (userRole === "contributor") {
      // Contributors can ONLY update their own issues
      if (existingIssue.reporter_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only update your own issues",
        });
      }
      // Contributors can ONLY update issues that are currently 'open'
      if (existingIssue.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "Bad Request: You can only update issues that are open",
        });
      }
    }

    // Prepare UPDATE query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (type) {
      if (!["bug", "feature_request"].includes(type)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid type value" });
      }
      updates.push(`type = $${paramIndex++}`);
      values.push(type);
    }

    if (status) {
      if (!["open", "in_progress", "resolved"].includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status value" });
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid field to update",
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(issueId);

    // Final UPDATE query
    const updateQuery = `
      UPDATE issues 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, values);

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ##### Delete Issue - Controller #####
export const deleteIssue = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const issueId = req.params.id;

    // targeted DELETE query
    const deleteQuery = `DELETE FROM issues WHERE id = $1 RETURNING id;`;
    const result = await pool.query(deleteQuery, [issueId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
