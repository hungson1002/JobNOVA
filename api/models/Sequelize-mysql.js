import dotenv from "dotenv";
import path from "path";
import { Sequelize } from "sequelize";
import { fileURLToPath } from "url";
import models from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("Loaded DB_NAME in Sequelize-mysql.js:", process.env.DB_NAME);

const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "453145",
  password: process.env.DB_PASSWORD || "151004abyss",
  password: process.env.DB_PASSWORD || "10022004",
  database: process.env.DB_NAME || "fiverr_new",
  port: 3306,
});

// Khởi tạo models
const initializedModels = Object.keys(models).reduce((acc, key) => {
  acc[key] = models[key](sequelize);
  return acc;
}, {});

// Định nghĩa quan hệ
const defineRelations = (models) => {
  // User-Company: 1-to-1 (one user can have one company)
  models.User.hasOne(models.Company, { foreignKey: 'clerk_id', sourceKey: 'clerk_id', as: 'company' });
  models.Company.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });

  // Company-CompanyImage: 1-to-many (one company can have multiple images)
  models.Company.hasMany(models.CompanyImage, { foreignKey: 'company_id' });
  models.CompanyImage.belongsTo(models.Company, { foreignKey: 'company_id' });

  // User-SeekerProfile: 1-to-1 (one user can have one seeker profile)
  models.User.hasOne(models.SeekerProfile, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.SeekerProfile.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });

  // User-ExperienceDetail: 1-to-many (one user can have multiple experience details)
  models.User.hasMany(models.ExperienceDetail, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.ExperienceDetail.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });

  // User-Gig: 1-to-many (one user can create multiple gigs as a seller)
  models.User.hasMany(models.Gig, { foreignKey: 'seller_clerk_id', sourceKey: 'clerk_id' });
  models.Gig.belongsTo(models.User, { foreignKey: 'seller_clerk_id', targetKey: 'clerk_id' });

  // Category-Gig: 1-to-many (one category can have multiple gigs)
  models.Category.hasMany(models.Gig, { foreignKey: 'category_id' });
  models.Gig.belongsTo(models.Category, { foreignKey: 'category_id' });

  // JobType-Gig: 1-to-many (one job type can have multiple gigs)
  models.JobType.hasMany(models.Gig, { foreignKey: 'job_type_id' });
  models.Gig.belongsTo(models.JobType, { foreignKey: 'job_type_id' });

  // Gig-Order: 1-to-many (one gig can have multiple orders)
  models.Gig.hasMany(models.Order, { foreignKey: 'gig_id' });
  models.Order.belongsTo(models.Gig, { foreignKey: 'gig_id' });

  // User-Order (Buyer): 1-to-many (one user can place multiple orders as a buyer)
  models.User.hasMany(models.Order, { foreignKey: 'buyer_clerk_id', sourceKey: 'clerk_id', as: 'buyer_orders' });
  models.Order.belongsTo(models.User, { foreignKey: 'buyer_clerk_id', targetKey: 'clerk_id', as: 'buyer' });

  // User-Order (Seller): 1-to-many (one user can receive multiple orders as a seller)
  models.User.hasMany(models.Order, { foreignKey: 'seller_clerk_id', sourceKey: 'clerk_id', as: 'seller_orders' });
  models.Order.belongsTo(models.User, { foreignKey: 'seller_clerk_id', targetKey: 'clerk_id', as: 'seller' });

  // Order-Review: 1-to-1 (one order can have one review)
  models.Order.hasOne(models.Review, { foreignKey: 'order_id' });
  models.Review.belongsTo(models.Order, { foreignKey: 'order_id' });

  // Gig-Review: 1-to-many (one gig can have multiple reviews)
  models.Gig.hasMany(models.Review, { foreignKey: 'gig_id' });
  models.Review.belongsTo(models.Gig, { foreignKey: 'gig_id' });

  // User-Review: 1-to-many (one user can write multiple reviews)
  models.User.hasMany(models.Review, { foreignKey: 'reviewer_clerk_id', sourceKey: 'clerk_id' });
  models.Review.belongsTo(models.User, { foreignKey: 'reviewer_clerk_id', targetKey: 'clerk_id' });

  // Order-Message: 1-to-many (one order can have multiple messages)
  models.Order.hasMany(models.Message, { foreignKey: 'order_id' });
  models.Message.belongsTo(models.Order, { foreignKey: 'order_id' });

  // User-Message (Sender): 1-to-many (one user can send multiple messages)
  models.User.hasMany(models.Message, { foreignKey: 'sender_clerk_id', sourceKey: 'clerk_id', as: 'sent_messages' });
  models.Message.belongsTo(models.User, { foreignKey: 'sender_clerk_id', targetKey: 'clerk_id' });

  // User-Message (Receiver): 1-to-many (one user can receive multiple messages)
  models.User.hasMany(models.Message, { foreignKey: 'receiver_clerk_id', sourceKey: 'clerk_id', as: 'received_messages' });
  models.Message.belongsTo(models.User, { foreignKey: 'receiver_clerk_id', targetKey: 'clerk_id' });

  // Order-Payment: 1-to-1 (one order can have one payment)
  models.Order.hasOne(models.Payment, { foreignKey: 'order_id' });
  models.Payment.belongsTo(models.Order, { foreignKey: 'order_id' });

  // User-Payment: 1-to-many (one user can make multiple payments)
  models.User.hasMany(models.Payment, { foreignKey: 'buyer_clerk_id', sourceKey: 'clerk_id' });
  models.Payment.belongsTo(models.User, { foreignKey: 'buyer_clerk_id', targetKey: 'clerk_id' });

  // User-SavedGig: 1-to-many (one user can save multiple gigs)
  models.User.hasMany(models.SavedGig, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.Gig.hasMany(models.SavedGig, { foreignKey: 'gig_id' });
  models.SavedGig.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });
  models.SavedGig.belongsTo(models.Gig, { foreignKey: 'gig_id' });

  // User-ContactForm: 1-to-many (one user can submit multiple contact forms)
  models.User.hasMany(models.ContactForm, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.ContactForm.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });

  // User-AdminLog (Admin): 1-to-many (one user can perform multiple admin actions)
  models.User.hasMany(models.AdminLog, { foreignKey: 'admin_clerk_id', sourceKey: 'clerk_id', as: 'admin_logs' });
  // User-AdminLog (Target): 1-to-many (one user can be the target of multiple admin actions)
  models.User.hasMany(models.AdminLog, { foreignKey: 'target_clerk_id', sourceKey: 'clerk_id', as: 'target_logs' });
  models.Gig.hasMany(models.AdminLog, { foreignKey: 'gig_id' });
  models.AdminLog.belongsTo(models.User, { foreignKey: 'admin_clerk_id', targetKey: 'clerk_id' });
  models.AdminLog.belongsTo(models.User, { foreignKey: 'target_clerk_id', targetKey: 'clerk_id' });
  models.AdminLog.belongsTo(models.Gig, { foreignKey: 'gig_id' });

  // User-SeekerSkill: 1-to-many (one user can have multiple skills)
  models.SeekerSkill.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });
  models.User.hasMany(models.SeekerSkill, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });

  // Gig-Skills: Many-to-many (one gig can have multiple skills, one skill can apply to multiple gigs)
  models.Gig.belongsToMany(models.Skills, { through: models.GigSkill, foreignKey: 'gig_id' });
  models.Skills.belongsToMany(models.Gig, { through: models.GigSkill, foreignKey: 'skill_id' });

  // Gig-GigView: 1-to-many (one gig can have multiple views)
  models.Gig.hasMany(models.GigView, { foreignKey: 'gig_id' });
  models.User.hasMany(models.GigView, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.GigView.belongsTo(models.Gig, { foreignKey: 'gig_id' });
  models.GigView.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });

  // Gig-GigViewCount: 1-to-1 (one gig has one view count)
  models.Gig.hasOne(models.GigViewCount, { foreignKey: 'gig_id' });
  models.GigViewCount.belongsTo(models.Gig, { foreignKey: 'gig_id' });

  // User-UserSearchHistory: 1-to-many (one user can have multiple search history entries)
  models.User.hasMany(models.UserSearchHistory, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.Category.hasMany(models.UserSearchHistory, { foreignKey: 'category_id' });
  models.JobType.hasMany(models.UserSearchHistory, { foreignKey: 'job_type_id' });
  models.UserSearchHistory.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });
  models.UserSearchHistory.belongsTo(models.Category, { foreignKey: 'category_id' });
  models.UserSearchHistory.belongsTo(models.JobType, { foreignKey: 'job_type_id' });

  // User-Notification: 1-to-many (one user can have multiple notifications)
  models.User.hasMany(models.Notification, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.Gig.hasMany(models.Notification, { foreignKey: 'gig_id' });
  models.Notification.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });
  models.Notification.belongsTo(models.Gig, { foreignKey: 'gig_id' });

  // User-CVFile: 1-to-many (one user can upload multiple CV files)
  models.User.hasMany(models.CVFile, { foreignKey: 'clerk_id', sourceKey: 'clerk_id' });
  models.CVFile.belongsTo(models.User, { foreignKey: 'clerk_id', targetKey: 'clerk_id' });

  // Gig-GigTranslation: 1-to-many (one gig can have multiple translations)
  models.Gig.hasMany(models.GigTranslation, { foreignKey: 'gig_id' });
  models.GigTranslation.belongsTo(models.Gig, { foreignKey: 'gig_id' });

  // Gig-GigFaq: 1-to-many (one gig can have multiple FAQs)
  models.Gig.hasMany(models.GigFaq, { foreignKey: "gig_id" });
  models.GigFaq.belongsTo(models.Gig, { foreignKey: "gig_id" });

  // Order-GigRequirements: 1-to-many (one order can have multiple requirements)
  models.Order.hasMany(models.GigRequirements, { foreignKey: "order_id" });
  models.GigRequirements.belongsTo(models.Order, { foreignKey: "order_id" });

};

defineRelations(initializedModels);

// Hook cho trigger after_gig_view_insert
initializedModels.GigView.afterCreate(async (gigView, options) => {
  await initializedModels.GigViewCount.upsert(
    {
      gig_id: gigView.gig_id,
      total_views: sequelize.literal("total_views + 1"),
    },
    { fields: ["total_views"] }
  );
});

export { initializedModels as models, sequelize };
