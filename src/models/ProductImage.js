const { DataTypes, Model } = require('sequelize');

class ProductImage extends Model {}

module.exports = (sequelize) => {
    ProductImage.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
        url: { type: DataTypes.STRING(500), allowNull: false, validate: { notEmpty: true } },
        altText: { type: DataTypes.STRING(160), allowNull: true, field: 'alt_text' },
        position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    }, {
        sequelize,
        modelName: 'ProductImage',
        tableName: 'product_images',
        indexes: [{ fields: ['product_id', 'position'] }],
    });

    return ProductImage;
};
