import Router from "express";
import { createIssue, getAllIssues, getIssueById } from "./issues.controller";
import { authenticateUser } from "../../middleware/auth.middleware";

const router = Router();

// Create issues (Only Authenticated users can create issues)
router.post("/", authenticateUser, createIssue);

// Retrieve all issues (Anyone can view all issues)
router.get("/", getAllIssues);

// Retrieve a single issue by ID (Anyone can view issue details)
router.get("/:id", getIssueById);

export default router;
