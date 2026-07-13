const { DataTypes, Model } = require('sequelize');

class Role extends Model {}

module.exports = (sequelize) => {
  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[A-Z][A-Z_]*$/,
          len: [3, 30],
        },
      },
      name: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      updatedAt: false,
    },
  );

  return Role;
};
