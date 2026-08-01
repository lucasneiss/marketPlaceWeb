const { DataTypes, Model } = require('sequelize');

class Notification extends Model {}

module.exports = (sequelize) => {
    Notification.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
        message: { type: DataTypes.STRING(255), allowNull: false },
        type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'GENERAL' },
        url: { type: DataTypes.STRING(255), allowNull: true },
        read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['user_id', 'read'] },
        ],
    });

    return Notification;
};
