import { DataTypes } from "sequelize";

const ReviewHelpfulVote = (sequelize) => {
  return sequelize.define("ReviewHelpfulVote", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    review_id: { type: DataTypes.INTEGER, allowNull: false },
    clerk_id: { type: DataTypes.STRING, allowNull: false },
    vote: { type: DataTypes.ENUM("yes", "no"), allowNull: false },
  }, {
    tableName: "review_helpful_votes",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["review_id", "clerk_id"] }
    ]
  });
};

export default ReviewHelpfulVote; 