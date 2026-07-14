const defineUser = require('./User');
const defineRole = require('./Role');
const defineUserRole = require('./UserRole');
const defineAddress = require('./Address');
const defineSellerProfile = require('./SellerProfile');
const defineProduct = require('./Product');

module.exports = (sequelize) => {
  const User = defineUser(sequelize);
  const Role = defineRole(sequelize);
  const UserRole = defineUserRole(sequelize);
  const Address = defineAddress(sequelize);
  const SellerProfile = defineSellerProfile(sequelize);
  const Product = defineProduct(sequelize);

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

  SellerProfile.hasMany(Product, {
    as: 'products',
    foreignKey: 'sellerId',
    onDelete: 'CASCADE',
  });
  Product.belongsTo(SellerProfile, {
    as: 'seller',
    foreignKey: 'sellerId',
  });

  UserRole.belongsTo(User, {
    as: 'assigner',
    foreignKey: 'assignedBy',
    onDelete: 'SET NULL',
  });

  return { User, Role, UserRole, Address, SellerProfile, Product };
};