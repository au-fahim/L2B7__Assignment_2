import Router from "express";
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from "./issues.controller";
import {
  authenticateUser,
  isMaintainer,
} from "../../middleware/auth.middleware";

const router = Router();

// Create issues (Only Authenticated users can create issues)
router.post("/", authenticateUser, createIssue);

// Retrieve all issues (Anyone can view all issues)
router.get("/", getAllIssues);

// Retrieve a single issue by ID (Anyone can view issue details)
router.get("/:id", getIssueById);

// Update an issue by ID 
// Maintainer (any issue) OR Contributor (own issue, only if status is open)
router.patch("/:id", authenticateUser, updateIssue);

// Delete an issue by ID (Only maintainers can delete issues)
router.delete("/:id", authenticateUser, isMaintainer, deleteIssue);

export default router;
