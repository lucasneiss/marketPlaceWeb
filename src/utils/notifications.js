const { models } = require('../database');

async function createNotification({ userId, message, type = 'GENERAL', url = null, transaction = null }) {
    return models.Notification.create({ userId, message, type, url }, { transaction });
}

function emitNotification(io, userId, notification) {
    if (!io || !userId) return;
    io.to(`user:${userId}`).emit('notification:new', {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        url: notification.url,
        createdAt: notification.createdAt,
    });
}

module.exports = { createNotification, emitNotification };
