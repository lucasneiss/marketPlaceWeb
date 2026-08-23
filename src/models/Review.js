const { DataTypes, Model } = require('sequelize');

class Review extends Model {}

module.exports = (sequelize) => {
    Review.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        clientId: { type: DataTypes.INTEGER, allowNull: false, field: 'client_id' },
        productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
        orderItemId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: 'order_item_id' },
        rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
        comment: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true, len: [3, 1000] } },
        status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'HIDDEN'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
    }, {
        sequelize,
        modelName: 'Review',
        tableName: 'reviews',
        indexes: [
            { fields: ['client_id'] },
            { fields: ['product_id'] },
            { fields: ['status'] },
        ],
    });

    return Review;
};
