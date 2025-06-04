import express from 'express';
import { handleClerkWebhook, banUser } from '../controllers/user.controller.js';
import { models } from "../models/Sequelize-mysql.js";

const router = express.Router();
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
    const user = await models.User.findOne({ where: { clerk_id: req.params.clerk_id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// Get user by username
router.get("/by-username/:username", async (req, res, next) => {
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

export default router;