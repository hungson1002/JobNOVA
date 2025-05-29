import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const OrderExtra = sequelize.define('OrderExtra', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gig_extra_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    extra_delivery_time: {
      type: DataTypes.INTEGER,
    },
  }, {
    tableName: 'order_extras',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['order_id', 'gig_extra_id'],
      },
      {
        fields: ['order_id'],
      },
      {
        fields: ['gig_extra_id'],
      },
    ],
  });

  return OrderExtra;
};