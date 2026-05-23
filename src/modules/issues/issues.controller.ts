import { type Request, type Response } from "express";
import pool from "../../config/db";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { sendError, sendSuccess } from "../../utils/response";
import type {
  CreateIssueBody,
  IssueReporter,
  UpdateIssueBody,
} from "../../types/issue.types";

// ##### Create Issue - Controller #####
export const createIssue = async (
  req: AuthRequest & Request<unknown, unknown, CreateIssueBody>,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, type } = req.body;

    // Extract the reporter_id securely from the verified JWT
    const reporterId = req.user?.id;

    if (!title || !description || !type) {
      return sendError(res, 400, "Title, description, and type are required");
    }

    if (!["bug", "feature_request"].includes(type)) {
      return sendError(
        res,
        400,
        "Invalid issue type. Must be 'bug' or 'feature_request'",
      );
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

    sendSuccess(res, 201, "Issue created successfully", result.rows[0]);
  } catch (error) {
    console.error("Error creating issue:", error);
    sendError(res, 500, "Internal server error");
  }
};

// ##### Get All Issues (with sorting and filtering) - Controller #####
export const getAllIssues = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { type, status, sort } = req.query;

    let query = `SELECT * FROM issues`;
    const queryParams: string[] = [];
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
      return sendSuccess(res, 200, "", []);
    }

    const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

    // Fetch only the users that reported these specific issues
    const userQuery = `SELECT id, name, role FROM users WHERE id = ANY($1::int[]);`;
    const userResult = await pool.query(userQuery, [reporterIds]);

    const userMap: Record<number, IssueReporter> = {};
    userResult.rows.forEach((user) => {
      userMap[user.id] = user as IssueReporter;
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

    sendSuccess(res, 200, "", formattedData);
  } catch (error) {
    console.error("Error fetching issues:", error);

    sendError(res, 500, "Internal server error");
  }
};

// ##### Get Issue by ID - Controller #####
export const getIssueById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const issueId = req.params.id;

    // 1. Fetch the specific issue
    const issueQuery = `SELECT * FROM issues WHERE id = $1;`;
    const issueResult = await pool.query(issueQuery, [issueId]);

    if (issueResult.rows.length === 0) {
      return sendError(res, 404, "Issue not found");
    }

    const issue = issueResult.rows[0];

    // 2. Fetch the specific reporter
    const userQuery = `SELECT id, name, role FROM users WHERE id = $1;`;
    const userResult = await pool.query(userQuery, [issue.reporter_id]);

    const singleIssue = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: userResult.rows[0] || null,
      created_at: issue.created_at.toISOString(),
      updated_at: issue.updated_at.toISOString(),
    };

    sendSuccess(res, 200, "", singleIssue);
  } catch (error) {
    console.error("Error fetching single issue:", error);
    sendError(res, 500, "Internal server error");
  }
};

// ##### Update Issue - Controller #####
export const updateIssue = async (
  req: AuthRequest & Request<{ id: string }, unknown, UpdateIssueBody>,
  res: Response,
): Promise<void> => {
  try {
    const issueId = req.params.id;
    const { title, description, type, status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const checkQuery = `SELECT reporter_id, status FROM issues WHERE id = $1;`;
    const checkResult = await pool.query(checkQuery, [issueId]);

    if (checkResult.rows.length === 0) {
      return sendError(res, 404, "Issue not found");
    }

    const existingIssue = checkResult.rows[0];

    if (userRole === "contributor") {
      // Contributors can ONLY update their own issues
      if (existingIssue.reporter_id !== userId) {
        return sendError(
          res,
          403,
          "Forbidden: You (as a contributor) can only update your own issues",
        );
      }

      // Contributors can ONLY update issues that are currently 'open'
      if (existingIssue.status !== "open") {
        return sendError(
          res,
          403,
          "Forbidden: You (as a contributor) can only update issues that are status 'open'",
        );
      }
    }

    // Prepare UPDATE query
    const updates: string[] = [];
    const values: (string | number)[] = [];
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
        return sendError(res, 400, "Invalid type value");
      }
      updates.push(`type = $${paramIndex++}`);
      values.push(type);
    }

    if (status) {
      if (!["open", "in_progress", "resolved"].includes(status)) {
        return sendError(res, 400, "Invalid status value");
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return sendError(
        res,
        400,
        "Please provide at least one valid field to update",
      );
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

    sendSuccess(res, 200, "Issue updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Error updating issue:", error);
    sendError(res, 500, "Internal server error");
  }
};

// ##### Delete Issue - Controller #####
export const deleteIssue = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const issueId = req.params.id;

    // targeted DELETE query
    const deleteQuery = `DELETE FROM issues WHERE id = $1 RETURNING id;`;
    const result = await pool.query(deleteQuery, [issueId]);

    if (result.rows.length === 0) {
      return sendError(res, 404, "Issue not found");
    }

    sendSuccess(res, 200, "Issue deleted successfully");
  } catch (error) {
    console.error("Error deleting issue:", error);
    sendError(res, 500, "Internal server error");
  }
};
