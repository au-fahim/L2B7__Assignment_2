import Router from "express";
import { createIssue } from "./issues.controller";
import { authenticateUser } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateUser, createIssue);

export default router;
