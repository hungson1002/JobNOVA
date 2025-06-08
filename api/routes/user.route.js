import express from 'express';
import { handleClerkWebhook, banUser, updateUserProfile, addEducation, updateEducation, deleteEducation, addCertification, updateCertification, deleteCertification } from '../controllers/user.controller.js';
import { models } from "../models/Sequelize-mysql.js";
import { authenticateAndLoadUser } from '../middleware/getAuth.js';
import requireAuth from '../middleware/requireAuth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Add JSON parsing middleware
// router.use(express.json());

// Webhook từ Clerk
router.post('/', express.raw({ type: 'application/json' }), handleClerkWebhook);


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
    // Tìm user trong danh sách users để lấy clerk_id
    const users = await models.User.findAll();
    const user = users.find(u => u.id === parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const clerk_id = user.clerk_id;
    console.log(`[DeleteUser] Starting deletion for user ${clerk_id}`);

    // Xóa các dữ liệu liên quan trước
    try {
      const deletePromises = [
        models.SeekerSkill.destroy({ where: { clerk_id } }).then(() => console.log(`[DeleteUser] Deleted seeker skills for user ${clerk_id}`)),
        models.SavedGig.destroy({ where: { clerk_id } }).then(() => console.log(`[DeleteUser] Deleted saved gigs for user ${clerk_id}`)),
        models.Review.destroy({ where: { reviewer_clerk_id: clerk_id } }).then(() => console.log(`[DeleteUser] Deleted reviews for user ${clerk_id}`)),
        models.Message.destroy({ 
          where: { 
            [Op.or]: [
              { sender_clerk_id: clerk_id },
              { receiver_clerk_id: clerk_id }
            ]
          }
        }).then(() => console.log(`[DeleteUser] Deleted messages for user ${clerk_id}`)),
        models.Payment.destroy({ where: { buyer_clerk_id: clerk_id } }).then(() => console.log(`[DeleteUser] Deleted payments for user ${clerk_id}`)),
        models.ContactForm.destroy({ where: { clerk_id } }).then(() => console.log(`[DeleteUser] Deleted contact forms for user ${clerk_id}`)),
        models.AdminLog.destroy({ 
          where: { 
            [Op.or]: [
              { admin_clerk_id: clerk_id },
              { target_clerk_id: clerk_id }
            ]
          }
        }).then(() => console.log(`[DeleteUser] Deleted admin logs for user ${clerk_id}`)),
        models.UserSearchHistory.destroy({ where: { clerk_id } }).then(() => console.log(`[DeleteUser] Deleted search history for user ${clerk_id}`)),
        models.Notification.destroy({ where: { clerk_id } }).then(() => console.log(`[DeleteUser] Deleted notifications for user ${clerk_id}`)),
        models.Portfolio.destroy({ where: { seller_clerk_id: clerk_id } }).then(() => console.log(`[DeleteUser] Deleted portfolio items for user ${clerk_id}`)),
        models.Education.destroy({ where: { clerk_id } }).then(() => console.log(`[DeleteUser] Deleted education records for user ${clerk_id}`)),
        models.Certification.destroy({ where: { clerk_id } }).then(() => console.log(`[DeleteUser] Deleted certifications for user ${clerk_id}`))
      ];

      await Promise.all(deletePromises);
      console.log(`[DeleteUser] Successfully deleted all related records for user ${clerk_id}`);
    } catch (deleteError) {
      console.error(`[DeleteUser] Error deleting related records:`, deleteError);
      throw deleteError;
    }

    // Sau đó xóa user
    await models.User.destroy({
      where: { clerk_id }
    });
    console.log(`[DeleteUser] Successfully deleted user ${clerk_id}`);

    res.status(200).json({ 
      success: true,
      message: "User and all related data have been successfully deleted",
      deletedUser: {
        id: user.id,
        clerk_id: user.clerk_id,
        username: user.username || "N/A",
        roles: user.user_roles
      }
    });
  } catch (err) {
    console.error('[DeleteUser] Error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error deleting user",
      error: err.message
    });
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