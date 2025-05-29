import express from "express";
import { createReport, getAllReports } from "../controllers/report.controller.js";
import { authenticateAndLoadUser, isAdmin } from "../middleware/getAuth.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/", requireAuth, authenticateAndLoadUser, createReport);
router.get("/", requireAuth, authenticateAndLoadUser, isAdmin, getAllReports);

export default router;
