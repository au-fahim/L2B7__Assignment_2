import Router from "express";
import { createIssue, getAllIssues } from "./issues.controller";
import { authenticateUser } from "../../middleware/auth.middleware";

const router = Router();

// Create issues (Only Authenticated users can create issues)
router.post("/", authenticateUser, createIssue);

// Retrieve all issues (Anyone can view all issues)
router.get("/", getAllIssues);

export default router;
