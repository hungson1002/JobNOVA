// gigRequirementTemplate.model.js
import { DataTypes } from 'sequelize';

const GigRequirementTemplate = (sequelize) =>
  sequelize.define(
    'GigRequirementTemplate',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      gig_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'gigs',
          key: 'id',
        },
      },
      requirement_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'gig_requirement_templates',
      timestamps: false,
    }
  );

export default GigRequirementTemplate;