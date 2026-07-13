const { DataTypes, Model } = require('sequelize');

class Address extends Model {}

module.exports = (sequelize) => {
  Address.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      label: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'Principal',
      },
      recipientName: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'recipient_name',
      },
      postalCode: {
        type: DataTypes.STRING(9),
        allowNull: false,
        field: 'postal_code',
        validate: { is: /^\d{5}-?\d{3}$/ },
      },
      street: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      complement: DataTypes.STRING(100),
      neighborhood: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(2),
        allowNull: false,
        validate: { is: /^[A-Z]{2}$/ },
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_default',
      },
    },
    {
      sequelize,
      modelName: 'Address',
      tableName: 'addresses',
      indexes: [{ fields: ['user_id'] }],
    },
  );

  return Address;
};
