const { DataTypes, Model } = require('sequelize');

class SellerProfile extends Model {}

module.exports = (sequelize) => {
  SellerProfile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'user_id',
      },
      storeName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'store_name',
        validate: { notEmpty: true, len: [3, 100] },
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: { is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'logo_url',
        validate: { isUrl: true },
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
    },
    {
      sequelize,
      modelName: 'SellerProfile',
      tableName: 'seller_profiles',
      indexes: [{ fields: ['status'] }],
    },
  );

  return SellerProfile;
};
