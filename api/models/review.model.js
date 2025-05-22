import { DataTypes } from "sequelize";

const Review = (sequelize) =>
  sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      gig_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "gigs",
          key: "id",
        },
      },
      reviewer_clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: "user_account",
          key: "clerk_id",
        },
      },
      rating: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      sellerResponse: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // helpful: {
      //   type: DataTypes.BOOLEAN,
      //   allowNull: true,
      // },
      helpfulYes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      helpfulNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sellerCommunication: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      qualityOfDelivery: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      valueOfDelivery: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
    },
    {
      tableName: "reviews",
      timestamps: false,
    }
  );

export default Review;