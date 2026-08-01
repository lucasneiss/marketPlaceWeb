const { DataTypes, Model } = require('sequelize');

class OrderItem extends Model {}

module.exports = (sequelize) => {
    OrderItem.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        orderId: { type: DataTypes.INTEGER, allowNull: false, field: 'order_id' },
        productId: { type: DataTypes.INTEGER, allowNull: true, field: 'product_id' },
        sellerId: { type: DataTypes.INTEGER, allowNull: false, field: 'seller_id' },
        productName: { type: DataTypes.STRING(120), allowNull: false, field: 'product_name' },
        sellerName: { type: DataTypes.STRING(100), allowNull: false, field: 'seller_name' },
        unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price', validate: { min: 0 } },
        quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
        discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
        imageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'image_url' },
    }, {
        sequelize,
        modelName: 'OrderItem',
        tableName: 'order_items',
        indexes: [
            { fields: ['order_id'] },
            { fields: ['product_id'] },
            { fields: ['seller_id'] },
        ],
    });

    return OrderItem;
};
