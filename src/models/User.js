const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

class User extends Model {
    toJSON() {
        const values = { ...this.get() };
        delete values.passwordHash;
        return values;
    }

    async checkPassword(password) {
        return bcrypt.compare(password, this.passwordHash);
    }
}

module.exports = (sequelize) => {
    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(120),
                allowNull: false,
                validate: { notEmpty: true, len: [2, 120] },
            },
            email: {
                type: DataTypes.STRING(254),
                allowNull: false,
                unique: true,
                validate: { isEmail: true },
                set(value) {
                    this.setDataValue('email', value.trim().toLowerCase());
                },
            },
            passwordHash: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: 'password_hash',
            },
            status: {
                type: DataTypes.ENUM('ACTIVE', 'BLOCKED'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            blockedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'blocked_at',
            },
            lastLoginAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'last_login_at',
            },
        },
        {
            sequelize,
            modelName: 'User',
            tableName: 'users',
            defaultScope: {
                attributes: { exclude: ['passwordHash'] },
            },
            scopes: {
                withPassword: { attributes: { include: ['passwordHash'] } },
            },
            indexes: [{ fields: ['status'] }],

            hooks: {
                beforeSave: async (user) => {
                    if (user.changed('passwordHash')) {
                        const salt = await bcrypt.genSalt(10);
                        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
                    }
                },
            },
        },
    );

    return User;
};