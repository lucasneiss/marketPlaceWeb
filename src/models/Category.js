const { DataTypes, Model } = require('sequelize');
const slugify = require('slugify');

class Category extends Model {}

module.exports = (sequelize) => {
    Category.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            name: {
                type: DataTypes.STRING(80),
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true,
                    len: [2, 80],
                },
            },

            slug: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                validate: {
                    is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                },
            },

            description: {
                type: DataTypes.STRING(240),
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Category',
            tableName: 'categories',

            // Buscar tipo: /catalog?category=eletronicos
            hooks: {
                beforeValidate: (category) => {
                    if (category.name && !category.slug) {
                        category.slug = slugify(category.name, {
                            lower: true,
                            strict: true,
                        });
                    }
                },
            },
        },
    );

    return Category;
};