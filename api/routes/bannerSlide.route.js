import express from "express";
import {
    createBannerSlide,
    deleteBannerSlide,
    getAllBannerSlides,
    updateBannerSlide,
    updatePosition
} from "../controllers/bannerSlide.controller.js";
import { authenticateAndLoadUser, isAdmin } from "../middleware/getAuth.js";
import requireAuth from "../middleware/requireAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getAllBannerSlides);
router.post("/", requireAuth, authenticateAndLoadUser, isAdmin, upload.single("image"), createBannerSlide);
router.put("/:id", requireAuth, authenticateAndLoadUser, isAdmin, upload.single("image"), updateBannerSlide);
router.put("/:id/position", requireAuth, authenticateAndLoadUser, isAdmin, updatePosition);
router.delete("/:id", requireAuth, authenticateAndLoadUser, isAdmin, deleteBannerSlide);

export default router;
