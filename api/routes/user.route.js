import express from 'express';
import { handleClerkWebhook, banUser, updateUserProfile, addEducation, updateEducation, deleteEducation, addCertification, updateCertification, deleteCertification } from '../controllers/user.controller.js';
import { models } from "../models/Sequelize-mysql.js";
import { authenticateAndLoadUser } from '../middleware/getAuth.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Add JSON parsing middleware
router.use(express.json());

// Webhook từ Clerk
router.post('/', express.raw({ type: 'application/json' }), handleClerkWebhook);
// All other routes: parse JSON as usual
// router.use(express.json());

// Get all users
router.get("/", async (req, res, next) => {
  try {
    const users = await models.User.findAll();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

// Get user by clerk_id
router.get("/:clerk_id", async (req, res, next) => {
  try {
    const user = await models.User.findOne({ 
      where: { clerk_id: req.params.clerk_id },
      include: [
        models.Education, 
        models.Certification,
        {
          model: models.SeekerSkill,
          include: [models.Skills]
        }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// Delete user
router.delete("/:id", async (req, res, next) => {
  try {
    const user = await models.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// Ban/Unban user
router.patch('/:clerk_id/ban', banUser);


// Get user by username
router.get("/username/:username", async (req, res, next) => {
  try {
    const user = await models.User.findOne({ where: { username: req.params.username } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// Update profile (yêu cầu xác thực)
router.patch("/:clerk_id/update-profile", requireAuth, authenticateAndLoadUser, updateUserProfile);

// Education routes
router.post("/:clerk_id/add-education", requireAuth, authenticateAndLoadUser, addEducation);
router.patch("/:clerk_id/update-education/:edu_id", requireAuth, authenticateAndLoadUser, updateEducation);
router.delete("/:clerk_id/delete-education/:edu_id", requireAuth, authenticateAndLoadUser, deleteEducation);

// Certification routes
router.post("/:clerk_id/add-certification", requireAuth, authenticateAndLoadUser, addCertification);
router.patch("/:clerk_id/update-certification/:cert_id", requireAuth, authenticateAndLoadUser, updateCertification);
router.delete("/:clerk_id/delete-certification/:cert_id", requireAuth, authenticateAndLoadUser, deleteCertification);

export default router;