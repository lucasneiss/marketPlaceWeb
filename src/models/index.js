const defineUser = require('./User');
const defineRole = require('./Role');
const defineUserRole = require('./UserRole');
const defineAddress = require('./Address');
const defineSellerProfile = require('./SellerProfile');
const defineCategory = require('./Category');
const defineProduct = require('./Product');
const defineProductImage = require('./ProductImage');
const defineNotification = require('./Notification');
const defineCart = require('./Cart');
const defineCartItem = require('./CartItem');
const defineOrder = require('./Order');
const defineOrderItem = require('./OrderItem');
const defineOrderStatusHistory = require('./OrderStatusHistory');
const defineReview = require('./Review');

module.exports = (sequelize) => {
    const User = defineUser(sequelize);
    const Role = defineRole(sequelize);
    const UserRole = defineUserRole(sequelize);
    const Address = defineAddress(sequelize);
    const SellerProfile = defineSellerProfile(sequelize);
    const Category = defineCategory(sequelize);
    const Product = defineProduct(sequelize);
    const ProductImage = defineProductImage(sequelize);
    const Notification = defineNotification(sequelize);
    const Cart = defineCart(sequelize);
    const CartItem = defineCartItem(sequelize);
    const Order = defineOrder(sequelize);
    const OrderItem = defineOrderItem(sequelize);
    const OrderStatusHistory = defineOrderStatusHistory(sequelize);
    const Review = defineReview(sequelize);

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

    User.hasMany(Address, { as: 'addresses', foreignKey: 'userId', onDelete: 'CASCADE' });
    Address.belongsTo(User, { as: 'user', foreignKey: 'userId' });

    User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId', onDelete: 'CASCADE' });
    Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

    User.hasOne(SellerProfile, { as: 'sellerProfile', foreignKey: 'userId', onDelete: 'CASCADE' });
    SellerProfile.belongsTo(User, { as: 'user', foreignKey: 'userId' });

    SellerProfile.hasMany(Product, { as: 'products', foreignKey: 'sellerId', onDelete: 'CASCADE' });
    Product.belongsTo(SellerProfile, { as: 'seller', foreignKey: 'sellerId' });

    Category.hasMany(Product, { as: 'products', foreignKey: 'categoryId', onDelete: 'RESTRICT' });
    Product.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });

    Product.hasMany(ProductImage, { as: 'images', foreignKey: 'productId', onDelete: 'CASCADE' });
    ProductImage.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

    User.hasOne(Cart, { as: 'cart', foreignKey: 'userId', onDelete: 'CASCADE' });
    Cart.belongsTo(User, { as: 'user', foreignKey: 'userId' });
    Cart.hasMany(CartItem, { as: 'items', foreignKey: 'cartId', onDelete: 'CASCADE' });
    CartItem.belongsTo(Cart, { as: 'cart', foreignKey: 'cartId' });
    Product.hasMany(CartItem, { as: 'cartItems', foreignKey: 'productId', onDelete: 'CASCADE' });
    CartItem.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

    User.hasMany(Order, { as: 'orders', foreignKey: 'clientId', onDelete: 'RESTRICT' });
    Order.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
    Address.hasMany(Order, { as: 'orders', foreignKey: 'addressId', onDelete: 'SET NULL' });
    Order.belongsTo(Address, { as: 'address', foreignKey: 'addressId' });

    Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId', onDelete: 'CASCADE' });
    OrderItem.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
    Product.hasMany(OrderItem, { as: 'orderItems', foreignKey: 'productId', onDelete: 'SET NULL' });
    OrderItem.belongsTo(Product, { as: 'product', foreignKey: 'productId' });
    SellerProfile.hasMany(OrderItem, { as: 'orderItems', foreignKey: 'sellerId', onDelete: 'RESTRICT' });
    OrderItem.belongsTo(SellerProfile, { as: 'seller', foreignKey: 'sellerId' });

    Order.hasMany(OrderStatusHistory, { as: 'history', foreignKey: 'orderId', onDelete: 'CASCADE' });
    OrderStatusHistory.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
    User.hasMany(OrderStatusHistory, { as: 'orderChanges', foreignKey: 'actorId', onDelete: 'SET NULL' });
    OrderStatusHistory.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });

    User.hasMany(Review, { as: 'reviews', foreignKey: 'clientId', onDelete: 'CASCADE' });
    Review.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
    Product.hasMany(Review, { as: 'reviews', foreignKey: 'productId', onDelete: 'CASCADE' });
    Review.belongsTo(Product, { as: 'product', foreignKey: 'productId' });
    OrderItem.hasOne(Review, { as: 'review', foreignKey: 'orderItemId', onDelete: 'CASCADE' });
    Review.belongsTo(OrderItem, { as: 'orderItem', foreignKey: 'orderItemId' });

    UserRole.belongsTo(User, { as: 'assigner', foreignKey: 'assignedBy', onDelete: 'SET NULL' });

    return {
        User,
        Role,
        UserRole,
        Address,
        SellerProfile,
        Category,
        Product,
        ProductImage,
        Notification,
        Cart,
        CartItem,
        Order,
        OrderItem,
        OrderStatusHistory,
        Review,
    };
};
