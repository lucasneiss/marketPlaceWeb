const { DataTypes, Model } = require('sequelize');

class Order extends Model {}

module.exports = (sequelize) => {
    Order.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        number: { type: DataTypes.STRING(40), allowNull: false, unique: true },
        clientId: { type: DataTypes.INTEGER, allowNull: false, field: 'client_id' },
        addressId: { type: DataTypes.INTEGER, allowNull: true, field: 'address_id' },
        recipientName: { type: DataTypes.STRING(120), allowNull: false, field: 'recipient_name' },
        postalCode: { type: DataTypes.STRING(9), allowNull: false, field: 'postal_code' },
        street: { type: DataTypes.STRING(160), allowNull: false },
        addressNumber: { type: DataTypes.STRING(20), allowNull: false, field: 'address_number' },
        complement: { type: DataTypes.STRING(100), allowNull: true },
        neighborhood: { type: DataTypes.STRING(100), allowNull: false },
        city: { type: DataTypes.STRING(100), allowNull: false },
        state: { type: DataTypes.STRING(2), allowNull: false },
        paymentMethod: {
            type: DataTypes.ENUM('PIX', 'CREDIT_CARD', 'BANK_SLIP'),
            allowNull: false,
            field: 'payment_method',
        },
        deliveryMethod: {
            type: DataTypes.ENUM('STANDARD', 'EXPRESS', 'PICKUP'),
            allowNull: false,
            field: 'delivery_method',
        },
        shippingPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'shipping_price',
            validate: { min: 0 },
        },
        total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
        status: {
            type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELED'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
    }, {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        indexes: [
            { fields: ['client_id'] },
            { fields: ['status'] },
            { fields: ['created_at'] },
        ],
    });

    return Order;
};
