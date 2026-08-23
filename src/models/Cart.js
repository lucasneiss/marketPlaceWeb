const { DataTypes, Model } = require('sequelize');

class Cart extends Model {}

module.exports = (sequelize) => {
    Cart.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: 'user_id' },
    }, {
        sequelize,
        modelName: 'Cart',
        tableName: 'carts',
    });

    return Cart;
};
