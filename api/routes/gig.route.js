import express from "express";
import {
  createGig,
  deleteGig,
  getAllGigs,
  getGigById,
  searchGigs,
  updateGig,
} from "../controllers/gig.controller.js";
import { authenticateAndLoadUser, isSellerOrAdmin } from "../middleware/getAuth.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", getAllGigs);
router.get("/:id", getGigById);
router.post("/", requireAuth, authenticateAndLoadUser, isSellerOrAdmin, createGig);
router.delete("/:id", requireAuth, authenticateAndLoadUser, isSellerOrAdmin, deleteGig);
router.put("/:id",requireAuth, authenticateAndLoadUser, isSellerOrAdmin, updateGig);
router.get("/search", searchGigs);

export default router;
