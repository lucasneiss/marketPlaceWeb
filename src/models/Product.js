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
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: 'category_id',
            },
            name: {
                type: DataTypes.STRING(120),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 120],
                },
            },
            slug: {
                type: DataTypes.STRING(120),
                allowNull: false,
                unique: true,
                validate: { is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            oldPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                field: 'old_price',
                validate: {
                    min: 0,
                },
            },
            discountPercent: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'discount_percent',
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            imageUrl: {
                type: DataTypes.STRING(500),
                allowNull: false,
                field: 'image_url',
            },
            imageAltText: {
                type: DataTypes.STRING(160),
                allowNull: true,
                field: 'image_alt_text',
            },
            imagePosition: {
                type: DataTypes.ENUM(
                    'top-left',
                    'top-right',
                    'bottom-left',
                    'bottom-right',
                ),
                allowNull: false,
                defaultValue: 'top-left',
                field: 'image_position',
            },
            state: {
                type: DataTypes.ENUM('UNKNOWN', 'GOOD', 'MEDIUM', 'BAD'),
                allowNull: false,
                defaultValue: 'GOOD',
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            status: {
                type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            rating: {
                type: DataTypes.DECIMAL(2, 1),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 5,
                },
            },
            reviewCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'review_count',
                validate: {
                    min: 0,
                },
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
                { fields: ['category_id'] },
                { fields: ['state'] },
                { fields: ['status'] },
                { fields: ['price'] },
                { fields: ['quantity'] },
                { fields: ['created_at'] },
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
