import { DataTypes } from "sequelize";

const ReviewHelpfulVote = (sequelize) => {
  return sequelize.define("ReviewHelpfulVote", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    review_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: "reviews",
        key: "id"
      }
    },
    clerk_id: { 
      type: DataTypes.STRING, 
      allowNull: false,
      references: {
        model: "user_account",
        key: "clerk_id"
      }
    },
    vote: { 
      type: DataTypes.ENUM("yes", "no"),
      allowNull: false
    }
  }, 
  {
    tableName: "review_helpful_votes",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["review_id", "clerk_id"] }
    ]
  });
};

export default ReviewHelpfulVote; 