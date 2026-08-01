const { DataTypes, Model } = require('sequelize');

class CartItem extends Model {}

module.exports = (sequelize) => {
    CartItem.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        cartId: { type: DataTypes.INTEGER, allowNull: false, field: 'cart_id' },
        productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1, max: 999 } },
    }, {
        sequelize,
        modelName: 'CartItem',
        tableName: 'cart_items',
        indexes: [
            { unique: true, fields: ['cart_id', 'product_id'] },
            { fields: ['product_id'] },
        ],
    });

    return CartItem;
};
