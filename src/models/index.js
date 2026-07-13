const defineUser = require('./User');
const defineRole = require('./Role');
const defineUserRole = require('./UserRole');
const defineAddress = require('./Address');
const defineSellerProfile = require('./SellerProfile');

module.exports = (sequelize) => {
  const User = defineUser(sequelize);
  const Role = defineRole(sequelize);
  const UserRole = defineUserRole(sequelize);
  const Address = defineAddress(sequelize);
  const SellerProfile = defineSellerProfile(sequelize);

  User.belongsToMany(Role, {
    through: UserRole,
    as: 'roles',
    foreignKey: 'userId',
    otherKey: 'roleId',
  });
  Role.belongsToMany(User, {
    through: UserRole,
    as: 'users',
    foreignKey: 'roleId',
    otherKey: 'userId',
  });

  User.hasMany(Address, {
    as: 'addresses',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
  Address.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  User.hasOne(SellerProfile, {
    as: 'sellerProfile',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
  SellerProfile.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  UserRole.belongsTo(User, {
    as: 'assigner',
    foreignKey: 'assignedBy',
    onDelete: 'SET NULL',
  });

  return { User, Role, UserRole, Address, SellerProfile };
};
