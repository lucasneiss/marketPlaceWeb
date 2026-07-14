const { DataTypes, Model } = require('sequelize');
const slugify = require('slugify');

class Product extends Model {}

module.exports = (sequelize) => {
    Product.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            sellerId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: 'seller_id',
            },
            name: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING(120),
                allowNull: false,
                unique: true,
                validate: { is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            logoUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'logo_url',
                validate: { isUrl: true },
            },
            state: {
                type: DataTypes.ENUM('UNKNOWN', 'GOOD', 'MEDIUM', 'BAD'),
                allowNull: false,
                defaultValue: 'UNKNOWN',
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            loggedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'logged_at',
            },
        },
        {
            sequelize,
            modelName: 'Product',
            tableName: 'products',
            indexes: [
                { fields: ['seller_id'] },
                { fields: ['state'] }
            ],
            hooks: {
                beforeValidate: (product) => {
                    if (product.name && !product.slug) {
                        product.slug = slugify(product.name, {
                            lower: true,
                            strict: true
                        });
                    }
                },
            }
        }
    );

    return Product;
};