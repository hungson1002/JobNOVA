import { models } from "../models/Sequelize-mysql.js";

export const authenticateAndLoadUser = async (req, res, next) => {
  const clerkId = req.auth?.userId;

  // 🔍 Log thông tin token Clerk gửi lên
  console.log("🔐 [getAuth] Clerk ID từ token:", clerkId);

  if (!clerkId) {
    console.error("❌ [getAuth] Thiếu Clerk ID (req.auth.userId)");
    const err = new Error("Unauthorized: Clerk token missing.");
    err.status = 401;
    return next(err);
  }

  try {
    const user = await models.User.findOne({
      where: { clerk_id: clerkId },
      attributes: ["id", "clerk_id", "user_roles"],
    });

    if (!user) {
      console.warn("⚠️ [getAuth] Không tìm thấy user trong DB với clerk_id:", clerkId);
      const err = new Error("Unauthorized: User not found in database.");
      err.status = 401;
      return next(err);
    }

    console.log("✅ [getAuth] User tìm thấy:", user.toJSON());

    req.user = user.toJSON();
    next();
  } catch (error) {
    console.error("❌ [getAuth] Lỗi khi truy vấn DB:", error);
    const err = new Error("Internal Server Error: Lỗi khi load user.");
    err.status = 500;
    return next(err);
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.user_roles)) {
    const err = new Error("User role data is missing or invalid.");
    err.status = 500;
    return next(err);
  }

  if (!req.user.user_roles.includes("admin")) {
    const err = new Error("Forbidden: Admin access required.");
    err.status = 403;
    return next(err);
  }

  console.log(`✅ Admin access granted to ${req.user.clerk_id}`);
  next();
};

export const isSeller = (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.user_roles)) {
    const err = new Error("User role data is missing or invalid.");
    err.status = 500;
    return next(err);
  }

  if (!req.user.user_roles.includes("employer")) {
    const err = new Error("Forbidden: Seller (employer) access required.");
    err.status = 403;
    return next(err);
  }

  console.log(`✅ Seller access granted to ${req.user.clerk_id}`);
  next();
};

export const isSellerOrAdmin = (req, res, next) => {
  const roles = req.user?.user_roles || [];
  if (roles.includes("employer") || roles.includes("admin")) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Access denied. Must be seller or admin." });
};
