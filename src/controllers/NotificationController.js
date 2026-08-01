const { models } = require('../database');
const { Notification } = models;

class NotificationController {
    static async list(req, res, next) {
        try {
            const notifications = await Notification.findAll({
                where: { userId: req.session.userId },
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('notifications', {
                titulo: 'Notificações', pagina: 'notifications', notifications,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async markAsRead(req, res, next) {
        try {
            const notification = await Notification.findOne({
                where: { id: req.params.id, userId: req.session.userId },
            });
            if (!notification) return res.status(404).json({ ok: false, message: 'Notificação não encontrada.' });
            notification.read = true;
            await notification.save();
            if (req.accepts(['json', 'html']) === 'json' || req.xhr) return res.json({ ok: true });
            return res.redirect('/notifications');
        } catch (error) {
            return next(error);
        }
    }

    static async markAllAsRead(req, res, next) {
        try {
            await Notification.update({ read: true }, { where: { userId: req.session.userId, read: false } });
            return res.json({ ok: true });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = NotificationController;
