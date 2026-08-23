const { DataTypes, Model } = require('sequelize');

class OrderStatusHistory extends Model {}

module.exports = (sequelize) => {
    OrderStatusHistory.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        orderId: { type: DataTypes.INTEGER, allowNull: false, field: 'order_id' },
        previousStatus: { type: DataTypes.STRING(30), allowNull: true, field: 'previous_status' },
        newStatus: { type: DataTypes.STRING(30), allowNull: false, field: 'new_status' },
        actorId: { type: DataTypes.INTEGER, allowNull: true, field: 'actor_id' },
        observation: { type: DataTypes.STRING(255), allowNull: true },
    }, {
        sequelize,
        modelName: 'OrderStatusHistory',
        tableName: 'order_status_history',
        updatedAt: false,
        indexes: [{ fields: ['order_id', 'created_at'] }],
    });

    return OrderStatusHistory;
};
