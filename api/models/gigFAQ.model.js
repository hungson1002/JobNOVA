import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const GigFaq = sequelize.define('GigFaq', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gig_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'gig_faq',
    timestamps: false,
    indexes: [
      {
        fields: ['gig_id'],
      },
    ],
  });

  return GigFaq;
};
